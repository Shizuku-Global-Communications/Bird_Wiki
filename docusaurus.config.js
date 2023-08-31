module.exports = {
    title: 'Bird Wiki 喵！',
    url: 'https://bird-wiki.zhiccc.net',
    baseUrl: '/',
    mySidebar: [
        {
            type: 'doc',
            id: 'README',
            label: '起始页',
        },
        {
            type: 'doc',
            id: 'sundry/definition',
            label: '文章定义',
        },
        {
            type: 'doc',
            id: 'sundry/introductions',
            label: '注意事项（引言）',
        },
        {
            type: 'category',
            label: '0. 在正式开始之前',
            items: [
                {
                    type: 'doc',
                    id: 'before-started/about-route',
                    label: '什么是路由',
                },
                {
                    type: 'doc',
                    id: 'before-started/about-bgp',
                    label: '什么是 BGP',
                },
                {
                    type: 'doc',
                    id: 'before-started/about-bird',
                    label: '什么是 BIRD',
                },
                {
                    type: 'doc',
                    id: 'before-started/transit-peering-customers',
                    label: '上游、对等、下游的关系',
                },
                {
                    type: 'doc',
                    id: 'before-started/pay-attention-to-filter',
                    label: '为什么要注意过滤器问题',
                },
                {
                    type: 'doc',
                    id: 'before-started/bad-behavior',
                    label: '不好的行为',
                },
            ],
        },
        {
            type: 'category',
            label: '1. BGP 连接和过滤器们',
            items: [
                {
                    type: 'doc',
                    id: 'sundry/start-your-bgp-session',
                    label: '建立 BGP 并做最基础的过滤',
                },
                {
                    type: 'doc',
                    id: 'sundry/new-filter',
                    label: '过滤器进阶',
                },
                {
                    type: 'doc',
                    id: 'sundry/build-inet',
                    label: '内部网络配置',
                },
            ],
        },
        {
            type: 'category',
            label: '2. 附录',
            items: [
                {
                    type: 'doc',
                    id: 'attachments/bird-2.0.10-install',
                    label: 'BIRD 的安装(以 2.0.10 为例)',
                },
                {
                    type: 'doc',
                    id: 'attachments/basic-filters',
                    label: '你可能会用得上的过滤器配置',
                },
                {
                    type: 'doc',
                    id: 'attachments/irr-rpki-build-and-use',
                    label: 'IRR 和 RPKI 的建立和食用方法',
                },
                {
                    type: 'doc',
                    id: 'attachments/special_thanks',
                    label: '鸣谢',
                },
            ],
        },
    ],
  };