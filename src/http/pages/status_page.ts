export const statusPage = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta http-equiv="x-ua-compatible" content="ie=edge">

    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>{{ statusCode }} {{ message }}</title>

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap"
    >

    [raw]
      <style>
        *,
        *::before,
        *::after {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        :root {
          --bg: #000;
          --font-sans: 'Inter', sans-serif;
          --text: #f5f5f5;
          --theme: #9868ff;
        }

        body {
          font-family: var(--font-sans);
          font-size: 15px;
          background: var(--bg);
          color: var(--text);
          display: grid;
          place-items: center;
          height: 100vh;
        }

        .error__status {
          margin-right: 8px;
        }

        .header {
          font-size: 38px;
          line-height: 54px;
          font-weight: 600;
          letter-spacing: -1.2px;
          text-align: center;
        }

        .header--small {
          font-size: 32px;
          letter-spacing: -1px;
        }

        .text-theme {
          color: var(--theme);
        }

        @media (min-width: 800px) {
          .header--small {
            font-size: 36px;
          }
        }
      </style>
    [/raw]
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
