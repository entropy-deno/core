// @deno-types="npm:@types/react"
import React from 'https://jspm.dev/react@18.0.0';

interface Props {
  message: string;
}

export function StatusPage({ message }: Props) {
  return <h1>{message}</h1>;
}
