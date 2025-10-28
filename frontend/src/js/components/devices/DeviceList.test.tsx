// Copyright 2019 Northern.tech AS
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
import { defaultState, render } from '@/testUtils';
import { TIMEOUTS } from '@northern.tech/store/constants';
import { undefineds } from '@northern.tech/testing/mockData';
import { prettyDOM, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import { getHeaders } from './AuthorizedDevices';
import { routes } from './BaseDevices';
import DeviceList, { calculateResizeChange } from './DeviceList';

describe('DeviceList Component', () => {
  it('renders correctly', async () => {
    const { baseElement } = render(
      <DeviceList
        columnHeaders={[{ name: 1 }, { name: 2 }, { name: 3 }, { name: 4 }]}
        customColumnSizes={[]}
        devices={[]}
        onResizeColumns={() => {}}
        deviceListState={{ ...defaultState.devices.deviceList, total: 50 }}
        onPageChange={vi.fn}
      />
    );
    // special snapshot handling here to work around unstable ids in mui code...
    const view = prettyDOM(baseElement.firstChild, 100000, { highlight: false })
      .replace(/(:?aria-labelledby|id)=":.*:"/g, '')
      .replace(/\\/g, '');
    expect(view).toMatchSnapshot();
    expect(view).toEqual(expect.not.stringMatching(undefineds));
  });

  it('allows column resizing calculations', async () => {
    const columnElements = [{ offsetWidth: 120 }, { offsetWidth: 120 }, { offsetWidth: 240 }, { offsetWidth: 120 }, { offsetWidth: 150 }, { offsetWidth: 120 }];
    const columnHeaders = [
      { attribute: { name: 'some', scope: 'thing' } },
      { attribute: { name: 'other', scope: 'thing' } },
      { attribute: { name: 'more', scope: 'thing' } },
      { attribute: { name: 'yet', scope: 'thing' } },
      { attribute: { name: 'different', scope: 'thing' } },
      { attribute: { name: 'last', scope: 'thing' } }
    ];
    let result = calculateResizeChange({ columnElements, columnHeaders, e: { clientX: 80 }, index: 2, prev: 90 });
    expect(result).toEqual([
      { attribute: { name: 'other', scope: 'thing' }, size: 120 },
      { attribute: { name: 'more', scope: 'thing' }, size: 120 },
      { attribute: { name: 'yet', scope: 'thing' }, size: 230 },
      { attribute: { name: 'different', scope: 'thing' }, size: 130 },
      { attribute: { name: 'last', scope: 'thing' }, size: 150 }
    ]);
    result = calculateResizeChange({ columnElements, columnHeaders, e: { clientX: 90 }, index: 2, prev: 80 });
    expect(result).toEqual([
      { attribute: { name: 'other', scope: 'thing' }, size: 120 },
      { attribute: { name: 'more', scope: 'thing' }, size: 120 },
      { attribute: { name: 'yet', scope: 'thing' }, size: 250 },
      { attribute: { name: 'different', scope: 'thing' }, size: 110 },
      { attribute: { name: 'last', scope: 'thing' }, size: 150 }
    ]);
    result = calculateResizeChange({ columnElements, columnHeaders, e: { clientX: 90 }, index: columnElements.length - 1, prev: 80 });
    expect(result).toEqual([
      { attribute: { name: 'other', scope: 'thing' }, size: 120 },
      { attribute: { name: 'more', scope: 'thing' }, size: 120 },
      { attribute: { name: 'yet', scope: 'thing' }, size: 240 },
      { attribute: { name: 'different', scope: 'thing' }, size: 120 },
      { attribute: { name: 'last', scope: 'thing' }, size: 150 }
    ]);
  });

  it('works as expected', { timeout: 3 * TIMEOUTS.refreshDefault }, async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onExpandClickMock = vi.fn();
    const onResizeColumns = vi.fn();
    const onPageChange = vi.fn();
    const onSelect = vi.fn();
    const onSort = vi.fn();
    const devices = defaultState.devices.byStatus.accepted.deviceIds.map(id => defaultState.devices.byId[id]);
    const pageTotal = devices.length;
    const headers = getHeaders([], routes.allDevices.defaultHeaders, 'id', vi.fn);
    const ui = (
      <DeviceList
        columnHeaders={headers}
        customColumnSizes={[]}
        devices={devices}
        deviceListState={defaultState.devices.deviceList}
        idAttribute="id"
        onExpandClick={onExpandClickMock}
        onResizeColumns={onResizeColumns}
        onPageChange={onPageChange}
        onSelect={onSelect}
        onSort={onSort}
        pageTotal={pageTotal}
      />
    );
    render(ui);
    await user.click(screen.getByText(devices[0].id));
    expect(onExpandClickMock).toHaveBeenCalled();

    await user.click(screen.getAllByRole('checkbox')[0]);
    expect(onSelect).toHaveBeenCalledWith([0, 1]);
    await user.click(screen.getAllByRole('checkbox')[2]);
    expect(onSelect).toHaveBeenCalledWith([1]);
  });
});
