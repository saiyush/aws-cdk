# AWS::IoTEvents Construct Library
<!--BEGIN STABILITY BANNER-->

---

![End-of-Support](https://img.shields.io/badge/End--of--Support-critical.svg?style=for-the-badge)

> AWS CDK v1 has reached End-of-Support on 2023-06-01.
> This package is no longer being updated, and users should migrate to AWS CDK v2.
>
> For more information on how to migrate, see the [_Migrating to AWS CDK v2_ guide][doc].
>
> [doc]: https://docs.aws.amazon.com/cdk/v2/guide/migrating-v2.html

---

<!--END STABILITY BANNER-->

AWS IoT Events enables you to monitor your equipment or device fleets for
failures or changes in operation, and to trigger actions when such events
occur. 

## Installation

Install the module:

```console
$ npm i @aws-cdk/aws-iotevents
```

Import it into your code:

```ts nofixture
import * as iotevents from '@aws-cdk/aws-iotevents';
```

## `DetectorModel`

The following example creates an AWS IoT Events detector model to your stack.
The detector model need a reference to at least one AWS IoT Events input.
AWS IoT Events inputs enable the detector to get MQTT payload values from IoT Core rules.

You can define built-in actions to use a timer or set a variable, or send data to other AWS resources.
See also [@aws-cdk/aws-iotevents-actions](https://docs.aws.amazon.com/cdk/api/v1/docs/aws-iotevents-actions-readme.html) for other actions.

```ts
import * as iotevents from '@aws-cdk/aws-iotevents';
import * as actions from '@aws-cdk/aws-iotevents-actions';
import * as lambda from '@aws-cdk/aws-lambda';

declare const func: lambda.IFunction;

const input = new iotevents.Input(this, 'MyInput', {
  inputName: 'my_input', // optional
  attributeJsonPaths: ['payload.deviceId', 'payload.temperature'],
});

const warmState = new iotevents.State({
  stateName: 'warm',
  onEnter: [{
    eventName: 'test-enter-event',
    condition: iotevents.Expression.currentInput(input),
    actions: [new actions.LambdaInvokeAction(func)], // optional
  }],
  onInput: [{ // optional
    eventName: 'test-input-event',
    actions: [new actions.LambdaInvokeAction(func)],
  }],
  onExit: [{ // optional
    eventName: 'test-exit-event',
    actions: [new actions.LambdaInvokeAction(func)],
  }],
});
const coldState = new iotevents.State({
  stateName: 'cold',
});

// transit to coldState when temperature is less than 15
warmState.transitionTo(coldState, {
  eventName: 'to_coldState', // optional property, default by combining the names of the States
  when: iotevents.Expression.lt(
    iotevents.Expression.inputAttribute(input, 'payload.temperature'),
    iotevents.Expression.fromString('15'),
  ),
  executing: [new actions.LambdaInvokeAction(func)], // optional
});
// transit to warmState when temperature is greater than or equal to 15
coldState.transitionTo(warmState, {
  when: iotevents.Expression.gte(
    iotevents.Expression.inputAttribute(input, 'payload.temperature'),
    iotevents.Expression.fromString('15'),
  ),
});

new iotevents.DetectorModel(this, 'MyDetectorModel', {
  detectorModelName: 'test-detector-model', // optional
  description: 'test-detector-model-description', // optional property, default is none
  evaluationMethod: iotevents.EventEvaluation.SERIAL, // optional property, default is iotevents.EventEvaluation.BATCH
  detectorKey: 'payload.deviceId', // optional property, default is none and single detector instance will be created and all inputs will be routed to it
  initialState: warmState,
});
```

To grant permissions to put messages in the input,
you can use the `grantWrite()` method:

```ts
import * as iam from '@aws-cdk/aws-iam';
import * as iotevents from '@aws-cdk/aws-iotevents';

declare const grantable: iam.IGrantable;
const input = iotevents.Input.fromInputName(this, 'MyInput', 'my_input');

input.grantWrite(grantable);
```