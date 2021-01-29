import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as Photorecog from '../lib/photorecog-stack';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new Photorecog.PhotorecogStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
