// @deno-types="npm:@types/react"
import React from 'https://jspm.dev/react@18.0.0';
import { StatusCode } from '../enums/status_code.enum.ts';

interface Props {
  status: StatusCode;
  message: string;
}

export function StatusPage({ status, message }: Props) {
  return (
    <html lang='en'>
      <head>
        <meta charSet='utf-8' />
        <meta httpEquiv='x-ua-compatible' content='ie=edge' />

        <meta name='viewport' content='width=device-width, initial-scale=1.0' />

        <title>{status} {message}</title>
      </head>

      <body>
        <h1>{status} {message}</h1>
      </body>
    </html>
  );
}
