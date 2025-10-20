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
import type { Dispatch, SetStateAction } from 'react';
import { useEffect, useRef } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import { Controller, useFormContext } from 'react-hook-form';

import { MenuItem, Select, Typography } from '@mui/material';

import { DocsLink, InlineLaunchIcon } from '@northern.tech/common-ui/DocsLink';
import Form from '@northern.tech/common-ui/forms/Form';
import FormCheckbox from '@northern.tech/common-ui/forms/FormCheckbox';
import TextInput from '@northern.tech/common-ui/forms/TextInput';

import { locationMap } from '../Login';

export type OrgData = {
  captcha: string | null;
  location: string;
  marketing?: boolean;
  name: string;
  tos: boolean;
};

const OrgDataContent = ({
  classes,
  emailVerified,
  recaptchaSiteKey = '',
  setCaptchaTimestamp
}: Pick<OrgDataProps, 'classes' | 'emailVerified' | 'recaptchaSiteKey' | 'setCaptchaTimestamp'>) => {
  const { control, register, setValue, trigger } = useFormContext();
  const inputRef = useRef<HTMLInputElement | undefined>();
  const captchaFieldName = 'captcha';

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleCaptchaChange = value => {
    setCaptchaTimestamp(new Date().getTime());
    setValue(captchaFieldName, value ? value : '');
    trigger(captchaFieldName);
  };

  return (
    <>
      <Typography variant="subtitle1" className="margin-bottom-x-small">
        Set an organization name
      </Typography>
      <TextInput
        controlRef={inputRef}
        id="name"
        label="Your organization name"
        hint="Your organization name"
        required
        requiredRendered={false}
        validations="isLength:1,trim"
      />
      {!emailVerified && <TextInput hint="Email *" label="Email *" id="email" required validations="isLength:1,isEmail,trim" />}
      <div className={classes.locationSelect}>
        <Typography variant="subtitle1">Hosting region</Typography>
        <div className="flexbox center-aligned slightly-smaller margin-bottom-x-small">
          <Typography variant="body2" className="margin-bottom-none margin-top-none margin-right-x-small">
            Choose a hosting region for your account.{' '}
            <DocsLink
              path="general/hosted-mender-regions"
              title={
                <>
                  Learn more <InlineLaunchIcon />
                </>
              }
            />
          </Typography>
        </div>
        <Controller
          name="location"
          control={control}
          render={({ field }) => (
            <Select
              renderValue={selected => {
                const { icon: Icon, title } = locationMap[selected];
                return (
                  <div className="flexbox center-aligned">
                    {title} <Icon className={classes.locationIcon} />
                  </div>
                );
              }}
              {...field}
            >
              {Object.entries(locationMap).map(([key, { icon: Icon, title }]) => (
                <MenuItem key={key} value={key}>
                  {title} <Icon className={classes.locationIcon} />
                </MenuItem>
              ))}
            </Select>
          )}
        />
      </div>
      <FormCheckbox
        id="tos"
        label={
          <label htmlFor="tos">
            By checking this you agree to our {/* eslint-disable-next-line react/jsx-no-target-blank */}
            <a href="https://northern.tech/legal/hosted-mender-agreement-northern-tech-as.pdf" target="_blank" rel="noopener">
              Terms of service <InlineLaunchIcon />
            </a>{' '}
            and {/* eslint-disable-next-line react/jsx-no-target-blank */}
            <a href="https://northern.tech/legal/privacy-policy" target="_blank" rel="noopener">
              Privacy Policy <InlineLaunchIcon />
            </a>{' '}
          </label>
        }
        required={true}
      />
      <FormCheckbox
        id="marketing"
        label="By checking this you agree that we can send you occasional email updates about Mender. You can unsubscribe from these emails at any time"
      />
      {recaptchaSiteKey && (
        <div className="margin-top">
          <input type="hidden" {...register(captchaFieldName, { required: 'reCAPTCHA is not completed' })} />
          <ReCAPTCHA sitekey={recaptchaSiteKey} onChange={handleCaptchaChange} />
        </div>
      )}
    </>
  );
};

const defaultValues: OrgData = { tos: false, location: '', marketing: false, name: '', captcha: '' };

type OrgDataProps = {
  classes: Record<string, string>;
  emailVerified: boolean;
  handleSignup: (formData: OrgData) => null;
  initialValues: OrgData;
  loading: boolean;
  recaptchaSiteKey: string;
  setCaptchaTimestamp: Dispatch<SetStateAction<number>>;
};

export const OrgDataEntry = (props: OrgDataProps) => {
  const { classes, initialValues, loading, handleSignup, ...remainder } = props;
  return (
    <Form
      className={classes.orgData}
      id="signup-org-data"
      buttonColor="primary"
      defaultValues={defaultValues}
      initialValues={initialValues}
      onSubmit={handleSignup}
      showButtons={!loading}
      submitLabel="Complete signup"
    >
      <h1>Create your Account</h1>
      <h2 className="margin-bottom-large">Complete the options below to finish creating your Mender account</h2>
      <OrgDataContent classes={classes} {...remainder} />
    </Form>
  );
};

export default OrgDataEntry;
