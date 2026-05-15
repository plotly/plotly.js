#!/usr/bin/env node

// Reads lines from stdin and emits only those where index % SHARD_TOTAL == SHARD_INDEX
// Environment variables SHARD_INDEX and SHARD_TOTAL must be set.

import { readFileSync } from 'fs';

const lines = readFileSync('/dev/stdin', 'utf8').trim().split('\n').filter(Boolean);
const index = parseInt(process.env.SHARD_INDEX);
const total = parseInt(process.env.SHARD_TOTAL);

if (isNaN(index) || isNaN(total) || total <= 0) {
    console.error('SHARD_INDEX and SHARD_TOTAL environment variables must be set to valid integers');
    process.exit(1);
}

lines.forEach((line, i) => {
    if (i % total === index) console.log(line);
});
