#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { PhotorecogStack } from '../lib/photorecog-stack';

const app = new cdk.App();
new PhotorecogStack(app, 'PhotorecogStack');
