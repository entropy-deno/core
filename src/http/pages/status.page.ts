export const statusPage = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta http-equiv="x-ua-compatible" content="ie=edge">

    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>{{ message }} • {{ statusCode }}</title>

    <link rel="preconnect" href="https://fonts.googleapis.com" @nonceProp>
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Urbanist:wght@600&display=swap"
      @nonceProp
    >

    <style @nonceProp>
      @raw
        *,
        *::before,
        *::after {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        :root {
          --bg: #fff;
          --font-sans: 'Urbanist', sans-serif;
          --text: #2e1065;
          --text-dark: #2e1065;
          --selection: #c4b5fd;
          --theme: #a78bfa;
        }

        @media (prefers-color-scheme: dark) {
          :root {
            --bg: #131214;
            --text: #e2e6ec;
            --theme: #a78bfa;
          }
        }

        ::selection {
          background: var(--selection);
          color: var(--text-dark);
        }

        body {
          font-family: var(--font-sans);
          font-size: 16px;
          font-weight: 500;
          letter-spacing: 0.1px;
          background: var(--bg);
          color: var(--text);
          display: grid;
          place-items: center;
          height: 100vh;
        }

        .error__status {
          margin-right: 8px;
          letter-spacing: 0;
        }

        .header {
          line-height: 54px;
          font-weight: 600;
          letter-spacing: -1px;
          text-align: center;
        }

        .header--small {
          font-size: 32px;
          letter-spacing: -0.5px;
        }

        .text-theme {
          color: var(--theme);
        }
      @/raw
    </style>
  </head>

  <body>
    <main class="error">
      <h1 class="header header--small">
        <span class="text-theme error__status">{{ statusCode }}</span> {{ message }}
      </h1>
    </main>
  </body>
</html>
`;
