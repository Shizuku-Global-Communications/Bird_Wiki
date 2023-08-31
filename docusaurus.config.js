module.exports = {
    title: 'Bird Wiki 喵！',
    url: 'https://bird-wiki.zhiccc.net',
    baseUrl: '/',
    onBrokenLinks: 'ignore',
    presets: [
        [
          '@docusaurus/preset-classic',
          {
            docs: {
                sidebarPath: require.resolve('./sidebar.js'),
            },
          },
        ],
      ],    
  };