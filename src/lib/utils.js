import fetch from 'node-fetch';
import { v4 as uuid } from 'uuid';
import httpsAgent from './httpsAgent.js';

export function generateToken() {
    return `gpgauthv1.3.0|36|${uuid()}|gpgauthv1.3.0`;
}

export async function _fetchPost(url, postParams, agent = httpsAgent) {
    const response = await fetch(url, {
        method: 'POST',
        body: new URLSearchParams(postParams),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        agent: agent
    });
    return response;
}