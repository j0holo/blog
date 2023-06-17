---
date: '2022-01-29'
title: pxeboot and autoinstall with OpenBSD 7.0
---

This is a post about notes I gatherd to get pxeboot and autoinstall working on OpenBSD 7.0. I already got it working earlier on version 6.9, but forgot to write it down somewhere.

It is almost to simple once you know which man pages to read and what is and isn't important.

You will need the following man-pages:

- [https://man.openbsd.org/pxeboot.8](https://man.openbsd.org/pxeboot.8)
- [https://man.openbsd.org/dhcpd.8](https://man.openbsd.org/dhcpd.8)
- [https://man.openbsd.org/dhcpd.conf.5](https://man.openbsd.org/dhcpd.conf.5)
- [https://man.openbsd.org/dhcp-options.5](https://man.openbsd.org/dhcp-options.5)
- [https://man.openbsd.org/tftpd.8](https://man.openbsd.org/tftpd.8)
- [https://man.openbsd.org/httpd.8](https://man.openbsd.org/httpd.8)
- [https://man.openbsd.org/httpd.conf.5](https://man.openbsd.org/httpd.conf.5)
- [https://man.openbsd.org/man8/disklabel.8](https://man.openbsd.org/man8/disklabel.8)
- [https://man.openbsd.org/autoinstall.8](https://man.openbsd.org/autoinstall.8)

## Configuration

First we will set up a dhcpd service to point systems booting with PXE to the right tftp server. The dhcpd.conf also allows you to already set the hostname of the system. Or you can do it later in the install.conf file to configure it via the autoinstall.

```text
option  domain-name "your.domain";
option  domain-name-servers 192.168.1.2;

subnet 192.168.1.0 netmask 255.255.255.0 {
  option routers 192.168.1.1;
  option broadcast-address 192.168.1.255;
  range 192.168.1.150 192.168.1.200;

  # an ip here is also okay
  next-server pxe.your.domain;
  filename "auto_install";

  host wyze1 {
    hardware ethernet 00:80:64:9D:BC:FD;
    fixed-address 192.168.1.10;
    option host-name "host.your.domain";
  }
}
```

After that we will set up the tftpd service to boot our system.

I created a new directory `/var/tftp` owned by the `_tftpd` user, which tftpd uses by default.

You will need to download the following files from an [OpenBSD mirror](https://cdn.openbsd.org/pub/OpenBSD/7.0/amd64/):

- pxeboot - used by PXE to bootstrap the system to download the bsd.rd
- bsd.rd - installer  with ramdisk kernel
- A symoblic symlink named auto_install that points to pxeboot
- A /var/tftp/etc/boot.conf with the contents: bsd.rd

My tftpd settings:

```text
$ rcctl get tftpd
tftpd_class=daemon
tftpd_flags=-v -4 /var/tftp/
tftpd_logger=
tftpd_rtable=0
tftpd_timeout=30
tftpd_user=root
```

Now that the tftpd service is running we can focus on the httpd service which will provide us with the install.conf and installation files needed for an automated install. We can also use httpd to host our own OpenBSD package mirror, but this is optional.

```text
chroot "/var/www"

server "pxe.your.domain" {
	listen on * port 80
	root "/openbsd"
}
```
*/etc/httpd.conf*

You can put your install.conf and disklabel file in `/var/www/openbsd/` and the autoinstall will automatically pick it up if you boot via PXE.

My files look like this:

```text
Which network interface do you wish to configure = re0 
IPv4 address for vio0 = dhcp
IPv6 address for vio0 = none
Which network interface do you wish to configure = done
Start sshd(8) by default = yes
Do you expect to run the X Window System = no
Setup a user = server
Full name for user server = server
Password for root = <hash pw for root>
Password for user server = <hash pw for server user>
Public ssh key for root account = <ssh pub key>
Public ssh key for user server = <ssh pub key>
Allow root ssh login = prohibit-password
What timezone are you in = Europe/Amsterdam
Which disk is the root disk = sd0
Use (W)hole disk MBR, whole disk (G)PT, (O)penBSD area or (E)dit = G
An EFI/GPT disk may not boot. Proceed = yes
URL to autopartitioning template for disklabel = http://nuc.dest.lan/disklabel
Location of sets = http
HTTP proxy URL = none
HTTP Server = server.your.domain
Server directory = pub/OpenBSD/7.0/amd64
Unable to connect using https. Use http instead = yes
Set name(s) = -x* -game*
```

I have weird systems that refuse to boot via MBR. The HTTP server can point to a remote mirror or to a local mirror if you have one.

Creating a local mirror is easy, but takes a while:

- Create the same directory structure as the mirror
- ftp 'ftp://ftp.nluug.nl/pub/OpenBSD/patches/7.0/common/*' 
- ftp 'ftp://ftp.nluug.nl/pub/OpenBSD/7.0/amd64/*' 
- ftp 'ftp://ftp.nluug.nl/pub/OpenBSD/7.0/packages/amd64/*' 
- ftp 'ftp://ftp.nluug.nl/pub/OpenBSD/7.0/packages-stable/amd64/*' 
- ftp 'ftp://ftp.nluug.nl/pub/OpenBSD/syspatch/7.0/amd64/*'


So in my case it the directory for the base system will be `mkdir -p  /var/www/openbsd/pub/OpenBSD/7.0/amd64`, enter it and run `ftp 'ftp://ftp.nluug.nl/pub/OpenBSD/7.0/amd64/'`. You can support multiple architectures by replacing the amd64 with `uname -p`.

You could run this in a cron job to get the latest syspatches and updated packages.

Now you should have a working environment for PXE booting machines/VMs. 