---
description: 此页面可能需要完善
---

# BIRD 2.0.10安装方法

正常情况下，你可以通过直接安装的方法，通过软件包管理器(比如 apt)直接安装 BIRD

对于 Ubuntu 用户

```
sudo add-apt-repository ppa:cz.nic-labs/bird
sudo apt-get update
sudo apt install bird2
```

对于 Debian 11 用户 (请注意：Debian 10 最高只支持 BIRD 2.0.7)

```
echo "deb http://deb.debian.org/debian bullseye-backports main" >> /etc/apt/sources.list
apt update
apt install bird2/bullseye-backports
```

对于想要尝鲜，想自己编译的用户

```
apt update
apt install -y build-essential autoconf git flex bison m4 libssh-dev libncurses-dev libreadline-dev
git clone https://gitlab.nic.cz/labs/bird.git -b v2.0.10 #2.0.10改成你需要的版本
cd bird
autoreconf
./configure --prefix= --sysconfdir=/etc/bird --runstatedir=/var/run/bird
make && make install
systemctl restart bird
```

对于懒得编译的用户，也可以下载gitlab的自动构建版本

- 打开 https://gitlab.nic.cz/labs/bird/-/pipelines?page=1&scope=all&ref=v2.0.10 #2.0.10改成你需要的版本

- 点击搜索结果右侧的下载按钮，选择你系统对应的安装包

  <figure><img src="/assets/images/gitlab-pipelines.png" alt=""></img><figcaption></figcaption></figure>

- 解压后会出现 `bird2_*.deb`，`bird2-dbgsym_*.deb`，`bird2-doc_*.deb` 三个文件，我们需要的是 `bird2_*.deb`

- 使用 `dpkg -i bird2_*.deb` 即可安装

