# 关于 BIRD

## BIRD是什么

以下文段来自 [BIRD](https://bird.network.cz/) [官](https://bird.network.cz/)[网](https://bird.network.cz/)

> **BIRD**项目旨在开发一个功能齐全的动态 IP 路由守护程序，主要针对（但不限于）Linux、FreeBSD 和其他类 UNIX 系统，并在 [GNU 通用公共许可证](http://www.gnu.org/copyleft/copyleft.html) 下分发。
>
> 目前它由 [CZ.NIC Labs](http://labs.nic.cz/) 开发和支持。目前 **BIRD** 团队成员有：
>
> * [Ondřej Filip](http://feela.network.cz/)（OSPF、BSD 端口、发布、打包）
> * [Martin Mareš](http://mj.ucw.cz/)（整体架构、核心、转储、BGP）
> * [Ondřej Zajíček](http://artax.karlin.mff.cuni.cz/~zajio1am/)（新的 BGP 功能、OSPFv3、BFD）
> * [Maria Matějka](http://mq.ucw.cz/)（MPLS、过滤器、多线程）
>
> 前**BIRD**团队成员是 [Libor Forst](http://www.ms.mff.cuni.cz/~forst/) 和 [Pavel Machek](http://atrey.karlin.mff.cuni.cz/~pavel/)。

如上所写，BIRD 是一个在 *nix 和 FreeBSD 平台运行的大部分由 C 实现的路由程序，支持包括但不限于 BGP、RIP、OSPF、Babel 等协议。同类产品还有 OpenBGPD, FRRouting 等。但是目前使用比较广的是 BIRD，本 wiki 也是为了 BIRD 而写。

在此Wiki发布时，BIRD 最新版本为 2.13.1，但本文还是会使用 BIRD 2.0.10 讲解。有些版本的源最新版可能是2.0.7，所以请前往 [这里](../attachments/bird-2.0.10-an-zhuang-fang-fa) 安装最新版本。

## 我看到了其他版本的 BIRD，身为新手我应该用那些版本吗

BIRD 目前有三个大版本：v1, v2, v3

### v1 <a href="#v1" id="v1"></a>

BIRD v1 是最早的 BIRD，由两个Daemon分别支持IPv4与IPv6的路由，最新版本是`1.6.8`，于2019年9月11日发布。
目前而言我们不推荐使用此版本。

### v2 <a href="#v2" id="v2"></a>

BIRD v2是目前 BIRD 的主线版本。与 v1 相比，v2 仅使用一个 Daemon 来运行 v4 与 v6 的路由。最新版本是`2.13.1`。
本 Wiki 将主要讲述该版本的使用。

### v3 <a href="#v3" id="v3"></a>

BIRD v3是 BIRD 的下一代版本，该版本增加了多线程的支持。目前的最新版本为3.0-alpha0，于2022年2月7日发布。
目前v3还处在 alpha 阶段，我们欢迎有时间的用户去测试这个版本，并给作者提出建议。

对于初入 BGP 或没用过 BIRD 的用户，我们建议使用 BIRD 2.0.10，当然，如果你想试试新版本，我们也不会阻止。
