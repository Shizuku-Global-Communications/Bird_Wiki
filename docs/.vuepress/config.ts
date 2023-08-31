import {defaultTheme,viteBundler} from "vuepress"
module.exports = {
    title: 'Bird Wiki',
    description: '一篇关于bird的百科（或者手册）',
    theme: defaultTheme({
        sidebar: {
            "/": [
                '/README.md',
                '/definition.md',
                '/introductions.md',
                {
                    text: "0. 在正式开始之前",
                    link: "/before-started/",
                    children: [
                        '/before-started/about-route.md',
                        '/before-started/about-bgp.md',
                        '/before-started/about-bird.md',
                        '/before-started/transit-peering-customers.md',
                        '/before-started/pay-attention-to-filter.md',
                        '/before-started/bad-behavior.md'
                    ]
                },
		        '/start-your-bgp-session.md',
		        '/new-filter.md',
		        '/build-inet.md',
		        {
                    text: "3. 附录",
                    link: "/attachments/",
                    children: [
                        '/attachments/bird-2.0.10-install.md',
                        '/attachments/basic-filters.md',
                        '/attachments/irr-rpki-build-and-use.md'
                    ]
                },
                '/special_thanks.md'			
            ]
            
        },
        navbar: [
            {
                text: "快速开始",
                link: "/before-started/"
            }
        ]
    }),
    bundler: viteBundler({
        viteOptions: {},
        vuePluginOptions: {},
    })
}
