#!/usr/bin/env node

import { SignalingServer } from '../src';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8080;
new SignalingServer({ port: PORT });
