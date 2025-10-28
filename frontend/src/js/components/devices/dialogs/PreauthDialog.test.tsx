// Copyright 2020 Northern.tech AS
//
//    Licensed under the Apache License, Version 2.0 (the "License");
//    you may not use this file except in compliance with the License.
//    You may obtain a copy of the License at
//
//        http://www.apache.org/licenses/LICENSE-2.0
//
//    Unless required by applicable law or agreed to in writing, software
//    distributed under the License is distributed on an "AS IS" BASIS,
//    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//    See the License for the specific language governing permissions and
//    limitations under the License.
import { Provider } from 'react-redux';

import { defaultState, render } from '@/testUtils';
import { TIMEOUTS } from '@northern.tech/store/constants';
import * as StoreThunks from '@northern.tech/store/thunks';
import { undefineds } from '@northern.tech/testing/mockData';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import configureStore from 'redux-mock-store';
import { thunk } from 'redux-thunk';
import { vi } from 'vitest';

import { PreauthDialog } from './PreauthDialog';

vi.mock('@northern.tech/store/thunks', { spy: true });

const mockStore = configureStore([thunk]);

const errorText = 'test-errortext';
const dropzone = '.dropzone input';

let store;

describe('PreauthDialog Component', () => {
  beforeEach(() => {
    store = mockStore({ ...defaultState });
  });

  it('renders correctly', async () => {
    const { baseElement } = render(
      <Provider store={store}>
        <PreauthDialog deviceLimitWarning={<div>I should not be rendered/ undefined</div>} limitMaxed={false} onSubmit={vi.fn} onCancel={vi.fn} />
      </Provider>
    );
    const view = baseElement.getElementsByClassName('MuiDialog-root')[0];
    expect(view).toMatchSnapshot();
    expect(view).toEqual(expect.not.stringMatching(undefineds));
  });

  it('works as intended', { timeout: TIMEOUTS.fiveSeconds + TIMEOUTS.oneSecond }, async () => {
    const { preauthDevice: preAuthSpy } = StoreThunks;

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime, applyAccept: false });
    const submitMock = vi.fn();
    const menderFile = new File(['testContent plain'], 'test.pem');
    const ui = (
      <Provider store={store}>
        <PreauthDialog limitMaxed={false} onSubmit={submitMock} onCancel={vi.fn()} />
      </Provider>
    );
    const { rerender } = render(ui);
    expect(screen.getByText(/upload a public key file/i)).toBeInTheDocument();
    // container.querySelector doesn't work in this scenario for some reason -> but querying document seems to work
    const uploadInput = document.querySelector(dropzone);
    await user.upload(uploadInput, menderFile);
    await act(async () => vi.runOnlyPendingTimers());
    await waitFor(() => rerender(ui));

    expect(uploadInput.files).toHaveLength(1);
    await waitFor(() => expect(document.querySelector(dropzone)).not.toBeInTheDocument());
    expect(screen.getByDisplayValue('test.pem')).toBeInTheDocument();
    const fabSelector = '.MuiFab-root';
    expect(document.querySelector(fabSelector)).toBeDisabled();
    await user.type(screen.getByPlaceholderText(/key/i), 'testKey');
    await user.type(screen.getByPlaceholderText(/value/i), 'testValue');
    expect(document.querySelector(fabSelector)).not.toBeDisabled();
    await user.click(document.querySelector(fabSelector));
    await waitFor(() => expect(screen.queryByText(errorText)).not.toBeInTheDocument());
    await act(async () => {
      vi.runOnlyPendingTimers();
      vi.runAllTicks();
    });
    submitMock.mockRejectedValueOnce(errorText);
    await user.click(screen.getByRole('button', { name: 'Save' }));
    act(() => {
      vi.runOnlyPendingTimers();
      vi.runAllTicks();
    });
    await waitFor(() => rerender(ui));
    await waitFor(() => expect(screen.queryByText(errorText)).toBeTruthy());
    await user.type(screen.getByDisplayValue('testValue'), 'testValues');
    await waitFor(() => expect(screen.queryByText(errorText)).not.toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'Save and add another' }));
    await waitFor(() => rerender(ui));
    expect(screen.queryByText('reached your limit')).toBeFalsy();
    expect(preAuthSpy).toHaveBeenCalled();
  });

  it('prevents preauthorizations when device limit was reached', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const menderFile = new File(['testContent plain'], 'test.pem');
    const ui = (
      <Provider store={store}>
        <PreauthDialog acceptedDevices={100} deviceLimit={2} limitMaxed={true} />
      </Provider>
    );

    const { rerender } = render(ui);
    // container.querySelector doesn't work in this scenario for some reason -> but querying document seems to work
    const uploadInput = document.querySelector(dropzone);
    await user.upload(uploadInput, menderFile);
    await waitFor(() => rerender(ui));
    await user.type(screen.getByPlaceholderText(/key/i), 'testKey');
    await user.type(screen.getByPlaceholderText(/value/i), 'testValue');
    await waitFor(() => rerender(ui));
    expect(screen.getByText(/You have reached your limit/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });
});
