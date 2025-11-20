import { existsSync, readFileSync, writeFileSync } from 'fs';
import crypto from 'crypto';

export function genPublicCode() {
  return crypto.randomUUID().split('-')[0];
}

export function genPrivateCode() {
  return crypto.randomUUID();
}

export function genBothCodes() {
  const pub = genPublicCode();
  const priv = genPrivateCode();
  return { pub, priv };
}

export function addCodesToFile(pub: string, priv: string) {
  const path = './codes.json';
  let codes: { pub: string; priv: string }[] = [];

  // if file exists, read and parse
  if (existsSync(path)) {
    try {
      const data = readFileSync(path, 'utf-8');
      codes = JSON.parse(data);
      if (!Array.isArray(codes)) codes = [];
    } catch {
      codes = [];
    }
  }

  // append new code
  codes.push({ pub, priv });

  // write back
  writeFileSync(path, JSON.stringify(codes, null, 2), 'utf-8');
}
