export const errorPage = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta http-equiv="x-ua-compatible" content="ie=edge">

    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>Error: {{ error.message }}</title>

    <link rel="preconnect" href="https://fonts.googleapis.com" [nonceProp]>
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Roboto+Mono&display=swap"
      [nonceProp]
    >

    [raw]
      <style [nonceProp]>
        *,
        *::before,
        *::after {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        :root {
          --bg: #000;
          --bg-block: #181818;
          --border: #232323;
          --font-mono: 'Roboto Mono', monospace;
          --font-sans: 'Inter', sans-serif;
          --red: #ff5c57;
          --text: #f5f5f5;
          --text-gray: #b2b2b2;
          --theme: #9868ff;
          --theme-light: #a981ff;
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
          font-size: 40px;
          line-height: 54px;
          font-weight: 600;
          letter-spacing: -1.2px;
        }

        .content {
          max-width: 1240px;
          width: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          background: var(--bg-block);
          padding: 42px;
          border-radius: 20px;
        }

        .badge {
          font-size: 13px;
          background: var(--red);
          padding: 4px 9px;
          border-radius: 8px;
          align-self: flex-start;
          margin-bottom: 8px;
        }

        .button {
          background: var(--theme);
          border: none;
          color: var(--text);
          padding: 12px 16px;
          border-radius: 12px;
          display: block;
          text-decoration: none;
          font: inherit;
          margin-top: 12px;
          user-select: none;
          cursor: pointer;
          transition: opacity 0.2s ease;
          align-self: flex-end;
          margin-top: 72px;
        }

        .button:hover {
          opacity: 0.95;
        }
      </style>
    [/raw]
  </head>

  <body>
    <main class="content">
      <div class="badge">Error</div>

      <h1 class="header">
        {{ error.message }}
      </h1>

      <button class="button" id="reload">
        Reload Page
      </button>
    </main>

    <script [nonceProp]>
      const reloadButton = document.getElementById('reload');

      reloadButton.addEventListener('click', () => {
        window.location.reload();
      });
    </script>
  </body>
</html>
`;
