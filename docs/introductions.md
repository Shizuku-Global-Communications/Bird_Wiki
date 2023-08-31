---
description: 在你开始进入 BGP 的世界前，你需要注意
---

# 引言

想要建立自己的网络的理由有很多：装逼、学习知识、自己实名上网……\
无论你想建立自己的网络的理由是什么，想要建立起人生的第一个 BGP session，你要确保你满足了以下条件

1. 一个 RIR 分配的 ASN (来自 APNIC, RIPE NCC, ARIN, AFRINIC, LACNIC 或者各地区的 NIR，比如 CNNIC)
2. 一段可路由的 IP 地址块（LIR分配给你ASN的时候基本都会顺便分一块 IPv6 /48，如果确定 LIR 没有分配，你也可以 Google 到一些可以免费获取 IPv6 地址块的地方）
3. 一个允许你使用 BGP 的服务商（比如 Vultr，BuyVM），或者允许你播 BGP 的隧道（比如[tunnelbroker.ch](https://tunnelbroker.ch)）
4. 钱钱（买机器要钱钱，买 IP 地址块也要钱钱，如果你想发展成一个大型网络，对钱的要求肯定高）
5. 基础的网络知识和 Linux 知识

如果你此时还没有 ASN，请先去寻找一个LIR并且在获取了 ASN 和 IP 地址块后继续
