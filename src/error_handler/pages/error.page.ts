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
      href="https://fonts.googleapis.com/css2?family=Urbanist:wght@400;500;700&family=Roboto+Mono&display=swap"
      [nonceProp]
    >

    <style [nonceProp]>
      [raw]
        *,
        *::before,
        *::after {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        :root {
          --bg: #030712;
          --bg-block: #111827;
          --font-mono: 'Roboto Mono', monospace;
          --font-sans: 'Urbanist', sans-serif;
          --red: #f43f5e;
          --text: #f3f4f6;
          --text-gray: #b2b2b2;
          --theme: #4f46e5;
        }

        body {
          font-family: var(--font-sans);
          font-size: 16px;
          background: var(--bg);
          color: var(--text);
          display: grid;
          place-items: center;
          height: 100vh;
        }

        .content {
          max-width: 1240px;
          width: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          background: var(--bg-block);
          padding: 52px;
          border-radius: 20px;
        }

        .info {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 20px;
        }

        .info__badge {
          font-size: 15px;
          background: var(--red);
          padding: 6px 12px;
          border-radius: 8px;
          align-self: flex-start;
        }

        .info__version {
          font-size: 14px;
          opacity: 0.6;
        }

        .header {
          font-size: 32px;
          line-height: 54px;
          font-weight: 700;
          letter-spacing: -1px;
        }

        .trace {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin: 30px 0;
        }

        .trace__header {
          margin-bottom: 8px;
          font-size: 18px;
          opacity: 0.7;
          font-weight: 400;
        }

        .trace__entry {
          padding: 14px 18px;
          border-radius: 10px;
          background: var(--bg);
          max-width: 400px;
        }

        .trace__entry:first-of-type {
          background: var(--theme);
        }

        .trace__entry-file {
          margin-top: 1px;
          font-size: 14px;
          opacity: 0.6;
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
          opacity: 0.9;
        }
      [/raw]
    </style>
  </head>

  <body>
    <main class="content">
      <div class="info">
        <div class="info__badge">Unhandled Error</div>

        <div class="info__version">Entropy {{ $VERSION }}</div>
        <div class="info__version">Deno {{ $DENO_VERSION }}</div>
      </div>

      <h1 class="header">
        {{ error.message }}
      </h1>

      <section class="trace">
        <h2 class="trace__header">Thrown in:</h2>

        [each (entry in stackTrace ?? [])]
          <div class="trace__entry">
            <p class="trace__entry-caller">
              {{ entry.split(' ')[0] }}
            </p>

            <p class="trace__entry-file">
              {{
                entry.includes('deno.land') || entry.split(' ')[1]?.includes('entropy-deno/core')
                  ? 'Entropy module'
                  : entry.split(' ')[1]?.split('src/')?.[1]
                    ? \`src/\${entry.split(' ')[1]?.split('src/')?.[1]?.slice(0, -1)}\`
                    : 'Deno runtime'
              }}
            </p>
          </div>
        [/each]
      </section>

      <button class="button" id="reload">Reload</button>
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
