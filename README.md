# 2d-dash-game

my-game
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── public
│   ├── favicon.svg
│   └── assets
│       └── ...static files copied as-is...
└── src
    ├── main.tsx
    ├── App.tsx
    ├── App.css
    ├── styles
    │   └── globals.css
    ├── routes
    │   └── index.tsx              # React Router route definitions (or your own router)
    ├── pages
    │   ├── Home
    │   │   ├── HomePage.tsx
    │   │   └── home.css
    │   ├── Game
    │   │   ├── GamePage.tsx       # mounts Phaser into a div
    │   │   └── game.css
    │   ├── About
    │   │   └── AboutPage.tsx
    │   └── NotFound
    │       └── NotFoundPage.tsx
    ├── components
    │   ├── Layout
    │   │   ├── Layout.tsx         # header/nav/footer shell
    │   │   └── layout.css
    │   └── Nav
    │       ├── Nav.tsx
    │       └── nav.css
    ├── game                         # Phaser “module” lives here
    │   ├── index.ts                 # export createGame(), types, etc.
    │   ├── Game.ts                  # createGame(containerId | element)
    │   ├── config.ts                # Phaser game config
    │   ├── constants.ts
    │   ├── scenes
    │   │   └── MainScene.ts
    │   ├── systems                  # (optional) input, camera helpers, etc.
    │   └── assets                   # (optional) imported assets (if not using public/)
    ├── lib
    │   └── ...shared utilities...
    ├── hooks
    │   └── ...shared React hooks...
    └── types
        └── ...shared TS types...