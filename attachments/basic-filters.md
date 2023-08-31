---
description: 这里包含着目前常用的固定定义
---

# 基础过滤定义

以下为固定定义

```
define BOGON_ASNS = [ # 定义保留ASN
    0,                      # RFC 7607
    23456,                  # RFC 4893 AS_TRANS
    64496..64511,           # RFC 5398 and documentation/example ASNs
    64512..65534,           # RFC 6996 Private ASNs
    65535,                  # RFC 7300 Last 16 bit ASN
    65536..65551,           # RFC 5398 and documentation/example ASNs
    65552..131071,          # RFC IANA reserved ASNs
    4200000000..4294967294, # RFC 6996 Private ASNs
    4294967295              # RFC 7300 Last 32 bit ASN
];
define BOGON_PREFIXES_V4 = [ # 定义保留IPv4前缀
    0.0.0.0/8+,             # RFC 1122 'this' network
    10.0.0.0/8+,            # RFC 1918 private space
    100.64.0.0/10+,         # RFC 6598 Carrier grade nat space
    127.0.0.0/8+,           # RFC 1122 localhost
    169.254.0.0/16+,        # RFC 3927 link local
    172.16.0.0/12+,         # RFC 1918 private space 
    192.0.2.0/24+,          # RFC 5737 TEST-NET-1
    192.88.99.0/24{25,32},        # RFC 7526 deprecated 6to4 relay anycast. If you wish to allow this, change `24+` to `24{25,32}`(no more specific)
    192.168.0.0/16+,        # RFC 1918 private space
    198.18.0.0/15+,         # RFC 2544 benchmarking
    198.51.100.0/24+,       # RFC 5737 TEST-NET-2
    203.0.113.0/24+,        # RFC 5737 TEST-NET-3
    224.0.0.0/4+,           # multicast
    240.0.0.0/4+            # reserved
];
define BOGON_PREFIXES_V6 = [ # 定义保留IPv6前缀
    ::/8+,                  # RFC 4291 IPv4-compatible, loopback, et al
    0064:ff9b::/96+,        # RFC 6052 IPv4/IPv6 Translation
    0064:ff9b:1::/48+,      # RFC 8215 Local-Use IPv4/IPv6 Translation
    0100::/64+,             # RFC 6666 Discard-Only
    2001::/32{33,128},      # RFC 4380 Teredo, no more specific
    2001:2::/48+,           # RFC 5180 BMWG
    2001:10::/28+,          # RFC 4843 ORCHID
    2001:db8::/32+,         # RFC 3849 documentation
    2002::/16{17,128},             # RFC 7526 deprecated 6to4 relay anycast. If you wish to allow this, change `16+` to `16{17,128}`(no more specific)
    3ffe::/16+, 5f00::/8+,  # RFC 3701 old 6bone
    fc00::/7+,              # RFC 4193 unique local unicast
    fe80::/10+,             # RFC 4291 link local unicast
    fec0::/10+,             # RFC 3879 old site local unicast
    ff00::/8+               # RFC 4291 multicast
];
define TIER1_ASN = [ # 定义Tier1的ASN用于检查bgp_path, Tier1的ASN来源：Wikipedia - Tier 1 Network
    7018,    # ATT
    3320,    # Deutsche Telekom AG
    3257,    # GTT
    6830,    # Liberty Global
    3356,    # Level3(Lumen)
    2914,    # NTT
    5511,    # Orange
    3491,    # PCCW Global
    1239,    # T-Mobile US (formerly Sprint)
    6453,    # TATA
    6762,    # Telecom Italia Sparkle
    1299,    # Arelion (formerly Telia Carrier)
    12956,   # Telxius
    701,     # Verizon (UUNET)
    6461,    # Zayo
    6939,    # Hurricane Electric(虽然定义上不是Tier1，但是覆盖范围让我觉得有必要添加)
    174      # Cogent(虽然定义上不是Tier1，但是覆盖范围让我觉得有必要添加)
];
```

一键调用除 TIER1_ASN 的集合以外的定义

```
function general_check(){ # 返回true则拒绝，返回false则允许
	if bgp_path ~ BOGON_ASNS then return true; # 如果路径包含保留ASN则返回true
    case net.type {
        NET_IP4: return net.len > 24 || net ~ BOGON_PREFIXES_V4; # IPv4 CIDR 大于 /24 为太长
        NET_IP6: return net.len > 48 || net ~ BOGON_PREFIXES_V6; # IPv6 CIDR 大于 /48 为太长
        else: print "unexpected net.type ", net.type, " ", net; return false; # 保底，一般不应该出现非IP4/IP6的前缀。
    }
}
```
