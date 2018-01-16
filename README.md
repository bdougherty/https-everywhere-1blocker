# https-everywhere-1blocker

> Utility for converting [HTTPS Everywhere](https://www.eff.org/https-everywhere) rules to a [1Blocker](https://1blocker.com) package.

Inspired by the [HTTPS Everywhere package by Joel Drapper](https://joeldrapper.com/https-everywhere) via [a Twitter thread](https://twitter.com/joeldrapper/status/907221891194212355).

## Usage

The npm `build` script will update HTTPS Everywhere and create the 1Blocker packages:

```sh
$ npm run build
```

There are two packages created, one that is a single rule with every domain, and another that contains separate rules for each domain. In my experience, 1Blocker has a lot of trouble with the package that has separate rules. Also note that there are quite a few rules that have rewrites and can't be converted to 1Blocker rules (a limitation of the content blocker API, not 1Blocker).

Once the `.1blockpkg` file is generated, open it with 1Blocker to activate. If you're syncing via iCloud, make sure to open 1Blocker on your iOS device to sync.

## License

MIT © [Brad Dougherty](https://brad.is)
