export const statusPage = `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta http-equiv="x-ua-compatible" content="ie=edge">

    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>{{ status }} {{ message }}</title>

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap">

    [raw]
      <style>
        a,hr{color:inherit}progress,sub,sup{vertical-align:baseline}blockquote,body,dd,dl,fieldset,figure,h1,h2,h3,h4,h5,h6,hr,menu,ol,p,pre,ul{margin:0}fieldset,legend,menu,ol,ul{padding:0}*,::after,::before{box-sizing:border-box;border:0 solid #e5e7eb;--tw-border-spacing-x:0;--tw-border-spacing-y:0;--tw-translate-x:0;--tw-translate-y:0;--tw-rotate:0;--tw-skew-x:0;--tw-skew-y:0;--tw-scale-x:1;--tw-scale-y:1;--tw-pan-x: ;--tw-pan-y: ;--tw-pinch-zoom: ;--tw-scroll-snap-strictness:proximity;--tw-gradient-from-position: ;--tw-gradient-via-position: ;--tw-gradient-to-position: ;--tw-ordinal: ;--tw-slashed-zero: ;--tw-numeric-figure: ;--tw-numeric-spacing: ;--tw-numeric-fraction: ;--tw-ring-inset: ;--tw-ring-offset-width:0px;--tw-ring-offset-color:#fff;--tw-ring-color:rgb(59 130 246 / 0.5);--tw-ring-offset-shadow:0 0 #0000;--tw-ring-shadow:0 0 #0000;--tw-shadow:0 0 #0000;--tw-shadow-colored:0 0 #0000;--tw-blur: ;--tw-brightness: ;--tw-contrast: ;--tw-grayscale: ;--tw-hue-rotate: ;--tw-invert: ;--tw-saturate: ;--tw-sepia: ;--tw-drop-shadow: ;--tw-backdrop-blur: ;--tw-backdrop-brightness: ;--tw-backdrop-contrast: ;--tw-backdrop-grayscale: ;--tw-backdrop-hue-rotate: ;--tw-backdrop-invert: ;--tw-backdrop-opacity: ;--tw-backdrop-saturate: ;--tw-backdrop-sepia: }::after,::before{--tw-content:''}html{line-height:1.5;-webkit-text-size-adjust:100%;-moz-tab-size:4;tab-size:4;font-family:DM Sans,sans-serif;font-feature-settings:normal;font-variation-settings:normal}body{line-height:inherit}hr{height:0;border-top-width:1px}abbr:where([title]){-webkit-text-decoration:underline dotted;text-decoration:underline dotted}h1,h2,h3,h4,h5,h6{font-size:inherit;font-weight:inherit}a{text-decoration:inherit}b,strong{font-weight:bolder}code,kbd,pre,samp{font-family:Roboto Mono,Cascadia Code,monospace;font-size:1em}small{font-size:80%}sub,sup{font-size:75%;line-height:0;position:relative}sub{bottom:-.25em}sup{top:-.5em}table{text-indent:0;border-color:inherit;border-collapse:collapse}button,input,optgroup,select,textarea{font-family:inherit;font-size:100%;font-weight:inherit;line-height:inherit;color:inherit;margin:0;padding:0}button,select{text-transform:none}[type=button],[type=reset],[type=submit],button{-webkit-appearance:button;background-color:transparent;background-image:none}:-moz-focusring{outline:auto}:-moz-ui-invalid{box-shadow:none}::-webkit-inner-spin-button,::-webkit-outer-spin-button{height:auto}[type=search]{-webkit-appearance:textfield;outline-offset:-2px}::-webkit-search-decoration{-webkit-appearance:none}::-webkit-file-upload-button{-webkit-appearance:button;font:inherit}summary{display:list-item}menu,ol,ul{list-style:none}textarea{resize:vertical}input::placeholder,textarea::placeholder{opacity:1;color:#9ca3af}[role=button],button{cursor:pointer}:disabled{cursor:default}audio,canvas,embed,iframe,img,object,svg,video{display:block;vertical-align:middle}img,video{max-width:100%;height:auto}[hidden]{display:none}::backdrop{--tw-border-spacing-x:0;--tw-border-spacing-y:0;--tw-translate-x:0;--tw-translate-y:0;--tw-rotate:0;--tw-skew-x:0;--tw-skew-y:0;--tw-scale-x:1;--tw-scale-y:1;--tw-pan-x: ;--tw-pan-y: ;--tw-pinch-zoom: ;--tw-scroll-snap-strictness:proximity;--tw-gradient-from-position: ;--tw-gradient-via-position: ;--tw-gradient-to-position: ;--tw-ordinal: ;--tw-slashed-zero: ;--tw-numeric-figure: ;--tw-numeric-spacing: ;--tw-numeric-fraction: ;--tw-ring-inset: ;--tw-ring-offset-width:0px;--tw-ring-offset-color:#fff;--tw-ring-color:rgb(59 130 246 / 0.5);--tw-ring-offset-shadow:0 0 #0000;--tw-ring-shadow:0 0 #0000;--tw-shadow:0 0 #0000;--tw-shadow-colored:0 0 #0000;--tw-blur: ;--tw-brightness: ;--tw-contrast: ;--tw-grayscale: ;--tw-hue-rotate: ;--tw-invert: ;--tw-saturate: ;--tw-sepia: ;--tw-drop-shadow: ;--tw-backdrop-blur: ;--tw-backdrop-brightness: ;--tw-backdrop-contrast: ;--tw-backdrop-grayscale: ;--tw-backdrop-hue-rotate: ;--tw-backdrop-invert: ;--tw-backdrop-opacity: ;--tw-backdrop-saturate: ;--tw-backdrop-sepia: }.flex{display:flex}.h-9{height:2.25rem}.h-screen{height:100vh}.w-\[3px\]{width:3px}.items-center{align-items:center}.justify-center{justify-content:center}.gap-7{gap:1.75rem}.rounded-full{border-radius:9999px}.bg-gray-400{--tw-bg-opacity:1;background-color:rgb(156 163 175 / var(--tw-bg-opacity))}.p-6{padding:1.5rem}.text-3xl{font-size:1.875rem;line-height:2.25rem}.text-5xl{font-size:3rem;line-height:1}.font-medium{font-weight:500}.text-gray-700{--tw-text-opacity:1;color:rgb(55 65 81 / var(--tw-text-opacity))}.text-purple-500{--tw-text-opacity:1;color:rgb(168 85 247 / var(--tw-text-opacity))}.selection\:bg-sky-300 ::selection{--tw-bg-opacity:1;background-color:rgb(125 211 252 / var(--tw-bg-opacity))}.selection\:bg-sky-300::selection{--tw-bg-opacity:1;background-color:rgb(125 211 252 / var(--tw-bg-opacity))}@media (prefers-color-scheme:dark){.dark\:bg-gray-700{--tw-bg-opacity:1;background-color:rgb(55 65 81 / var(--tw-bg-opacity))}.dark\:bg-gray-950{--tw-bg-opacity:1;background-color:rgb(3 7 18 / var(--tw-bg-opacity))}.dark\:text-purple-400{--tw-text-opacity:1;color:rgb(192 132 252 / var(--tw-text-opacity))}.dark\:text-slate-200{--tw-text-opacity:1;color:rgb(226 232 240 / var(--tw-text-opacity))}.dark\:selection\:bg-gray-700\/50 ::selection{background-color:rgb(55 65 81 / .5)}.dark\:selection\:bg-gray-700\/50::selection{background-color:rgb(55 65 81 / .5)}}
      </style>
    [/raw]
  </head>

  <body class="selection:bg-sky-300 dark:selection:bg-gray-700/50 dark:bg-gray-950">
    <main class="text-gray-700 flex h-screen items-center justify-center gap-7 dark:text-slate-200 p-6">
      <h1 class="text-5xl text-purple-500 dark:text-purple-400 font-medium">
        {{ status }}
      </h1>

      <div class="bg-gray-400 dark:bg-gray-700 w-[3px] h-9 rounded-full"></div>

      <p class="text-3xl font-medium">{{ message }}</p>
    </main>
  </body>
</html>
`;
