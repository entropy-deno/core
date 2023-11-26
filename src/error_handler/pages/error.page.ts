export const errorPage = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta http-equiv="x-ua-compatible" content="ie=edge">

    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>Error: {{ error.message }}</title>

    <link rel="preconnect" href="https://fonts.googleapis.com" @nonceProp>
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Urbanist:wght@400;500;700&family=Roboto+Mono&display=swap"
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
          --bg: #111827;
          --bg-block: #161f33;
          --font-mono: 'Roboto Mono', monospace;
          --font-sans: 'Urbanist', sans-serif;
          --red: #f43f5e;
          --text: #f3f4f6;
          --text-gray: #b2b2b2;
          --text-dark: #052133;
          --selection: #c4b5fd;
          --theme: #a78bfa;
        }

        ::selection {
          background: var(--selection);
          color: var(--text-dark);
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
          font-weight: 500;
        }

        .info__badge {
          font-size: 15px;
          background: var(--red);
          padding: 6px 10px;
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
          letter-spacing: -0.5px;
        }

        .trace {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin: 30px 0;
        }

        .trace__header {
          margin-bottom: 8px;
          font-size: 16px;
          opacity: 0.7;
          font-weight: 400;
        }

        .trace__entry {
          padding: 14px 18px;
          border-radius: 10px;
          background: var(--bg);
          max-width: 400px;
          font-weight: 500;

          &:first-of-type {
            background: var(--theme);
            color: var(--text-dark);
          }
        }

        .trace__entry-file {
          margin-top: 1px;
          font-size: 14px;
          opacity: 0.6;
        }

        .button {
          background: var(--theme);
          border: none;
          color: var(--text-dark);
          padding: 12px 16px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 4px;
          text-decoration: none;
          font: inherit;
          margin-top: 12px;
          user-select: none;
          cursor: pointer;
          transition: opacity 0.2s ease;
          align-self: flex-end;
          margin-top: 72px;

          &:hover {
            opacity: 0.9;
          }

          & svg {
            width: 18px;
            height: 18px;
          }
        }
      @/raw
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

        @for (entry in stackTrace ?? [])
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
        @/for
      </section>

      <button class="button" id="reload">
        Reload
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
          />
        </svg>
      </button>
    </main>

    <script @nonceProp>
      const reloadButton = document.querySelector('#reload');

      reloadButton.addEventListener('click', () => {
        window.location.reload();
      });
    </script>
  </body>
</html>
`;
