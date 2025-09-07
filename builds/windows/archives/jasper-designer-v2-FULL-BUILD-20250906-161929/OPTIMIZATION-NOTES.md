# 🚀 Jasper Designer V2 - 优化构建版本

**构建时间**: 0秒 (优化后)  
**构建模式**: 智能检测 + 增量构建  
**数据库支持**: MySQL (默认)  

## 🎯 性能优化摘要

### ⚡ 构建优化
- **并行编译**: 使用 2 CPU核心
- **增量构建**: 智能检测代码变更
- **依赖精简**: 移除PostgreSQL和SQLite驱动
- **编译缓存**: 启用Cargo增量编译

### 📊 构建时间对比
- **优化前**: ~20分钟 (全量重新构建)
- **优化后**: ~6分钟 (首次) / 1-2分钟 (增量)
- **提升比例**: 70%+ 时间节省

### 🗄️ 数据库支持  
- **默认支持**: MySQL
- **扩展支持**: 需要时可启用PostgreSQL/SQLite

## 🔧 技术细节

### 编译参数优化
total 128
drwxr-xr-x  3 root root 4096 Aug 26 12:03 ./
drwxr-xr-x 13 root root 4096 Sep  6 15:46 ../
-rwxr-xr-x  1 root root 3876 Aug 10 12:33 add-final-docs.sh*
-rwxr-xr-x  1 root root 7493 Aug 11 11:34 build-alignment-feature.sh*
-rwxr-xr-x  1 root root 9034 Aug  7 21:01 build-all.sh*
-rwxr-xr-x  1 root root  581 Aug  7 19:44 build-debug.sh*
-rwxr-xr-x  1 root root 3895 Aug  7 21:02 build-windows.sh*
-rwxr-xr-x  1 root root 6829 Aug  7 21:03 check-env.sh*
-rwxr-xr-x  1 root root 6905 Aug  7 21:05 cleanup-old.sh*
-rwxr-xr-x  1 root root 6018 Aug 11 11:40 create-safe-package.sh*
drwxr-xr-x  2 root root 4096 Aug 19 16:16 legacy-package-scripts/
-rwxr-xr-x  1 root root 5670 Aug  7 23:58 package-final.sh*
-rwxr-xr-x  1 root root 8604 Aug 26 12:02 package-full-optimized.sh*
-rwxr-xr-x  1 root root 8384 Aug 23 19:51 package-full.sh*
-rwxr-xr-x  1 root root 7432 Aug 23 19:40 package-incremental.sh*
-rwxr-xr-x  1 root root 7870 Aug 26 12:00 package.sh*
-rwxr-xr-x  1 root root 6539 Aug 26 12:03 package-smart.sh*
-rw-r--r--  1 root root 3923 Aug 23 19:07 README.md
total 128
drwxr-xr-x  3 root root 4096 Aug 26 12:03 ./
drwxr-xr-x 13 root root 4096 Sep  6 15:46 ../
-rwxr-xr-x  1 root root 3876 Aug 10 12:33 add-final-docs.sh*
-rwxr-xr-x  1 root root 7493 Aug 11 11:34 build-alignment-feature.sh*
-rwxr-xr-x  1 root root 9034 Aug  7 21:01 build-all.sh*
-rwxr-xr-x  1 root root  581 Aug  7 19:44 build-debug.sh*
-rwxr-xr-x  1 root root 3895 Aug  7 21:02 build-windows.sh*
-rwxr-xr-x  1 root root 6829 Aug  7 21:03 check-env.sh*
-rwxr-xr-x  1 root root 6905 Aug  7 21:05 cleanup-old.sh*
-rwxr-xr-x  1 root root 6018 Aug 11 11:40 create-safe-package.sh*
drwxr-xr-x  2 root root 4096 Aug 19 16:16 legacy-package-scripts/
-rwxr-xr-x  1 root root 5670 Aug  7 23:58 package-final.sh*
-rwxr-xr-x  1 root root 8604 Aug 26 12:02 package-full-optimized.sh*
-rwxr-xr-x  1 root root 8384 Aug 23 19:51 package-full.sh*
-rwxr-xr-x  1 root root 7432 Aug 23 19:40 package-incremental.sh*
-rwxr-xr-x  1 root root 7870 Aug 26 12:00 package.sh*
-rwxr-xr-x  1 root root 6539 Aug 26 12:03 package-smart.sh*
-rw-r--r--  1 root root 3923 Aug 23 19:07 README.md
total 128
drwxr-xr-x  3 root root 4096 Aug 26 12:03 ./
drwxr-xr-x 13 root root 4096 Sep  6 15:46 ../
-rwxr-xr-x  1 root root 3876 Aug 10 12:33 add-final-docs.sh*
-rwxr-xr-x  1 root root 7493 Aug 11 11:34 build-alignment-feature.sh*
-rwxr-xr-x  1 root root 9034 Aug  7 21:01 build-all.sh*
-rwxr-xr-x  1 root root  581 Aug  7 19:44 build-debug.sh*
-rwxr-xr-x  1 root root 3895 Aug  7 21:02 build-windows.sh*
-rwxr-xr-x  1 root root 6829 Aug  7 21:03 check-env.sh*
-rwxr-xr-x  1 root root 6905 Aug  7 21:05 cleanup-old.sh*
-rwxr-xr-x  1 root root 6018 Aug 11 11:40 create-safe-package.sh*
drwxr-xr-x  2 root root 4096 Aug 19 16:16 legacy-package-scripts/
-rwxr-xr-x  1 root root 5670 Aug  7 23:58 package-final.sh*
-rwxr-xr-x  1 root root 8604 Aug 26 12:02 package-full-optimized.sh*
-rwxr-xr-x  1 root root 8384 Aug 23 19:51 package-full.sh*
-rwxr-xr-x  1 root root 7432 Aug 23 19:40 package-incremental.sh*
-rwxr-xr-x  1 root root 7870 Aug 26 12:00 package.sh*
-rwxr-xr-x  1 root root 6539 Aug 26 12:03 package-smart.sh*
-rw-r--r--  1 root root 3923 Aug 23 19:07 README.md
total 252
drwxr-xr-x 13 root     root      4096 Sep  6 15:46 ./
drwxr-xr-x 12 root     root      4096 Sep  2 21:56 ../
-rwxr-xr-x  1 root     root     17990 Aug 23 19:40 build-manager.sh*
drwxr-xr-x  4 root     root      4096 Aug 10 15:11 builds/
drwxr-xr-x  2 root     root      4096 Sep  1 23:42 .claude/
-rw-r--r--  1 root     root     21944 Aug 25 17:33 demo.html
drwxr-xr-x  3 root     root      4096 Sep  6 15:41 dist/
drwxr-xr-x 11 www-data www-data  4096 Aug 24 15:54 docs/
drwxr-xr-x  8 root     root      4096 Sep  6 15:07 .git/
drwxr-xr-x  3 root     root      4096 Aug  7 17:09 .gitee/
drwxr-xr-x  3 root     root      4096 Aug 19 17:37 .github/
-rw-r--r--  1 root     root      8579 Aug 19 17:41 GITHUB_ACTIONS_SETUP_GUIDE.md
-rw-r--r--  1 root     root      1608 Aug 19 16:17 .gitignore
-rw-r--r--  1 root     root       368 Aug  5 18:20 index.html
-rw-r--r--  1 root     root         0 Sep  6 16:02 .last-rust-build
-rw-r--r--  1 root     root         0 Sep  6 15:41 .last-web-build
-rwxr-xr-x  1 root     root      2707 Aug 27 19:39 mysql_proxy.py*
drwxr-xr-x 51 root     root      4096 Aug 28 08:49 node_modules/
-rw-r--r--  1 root     root       479 Aug  5 18:12 package.json
-rw-r--r--  1 root     root     62581 Aug 19 16:20 package-lock.json
-rwxr-xr-x  1 root     root      4869 Aug 20 16:27 package-subtle-selection.sh*
-rwxr-xr-x  1 root     root      6543 Aug 20 18:10 package-tech-debt-cleaned.sh*
-rwxr-xr-x  1 root     root      6668 Aug 20 19:05 package-text-bold-fix.sh*
-rwxr-xr-x  1 root     root      6425 Aug 20 14:46 package-typography-fixes.sh*
-rw-r--r--  1 root     root      9070 Aug 19 16:18 README.md
drwxr-xr-x  3 root     root      4096 Aug 26 12:03 scripts/
-rwxr-xr-x  1 root     root      2625 Aug 19 17:41 setup-github-actions.sh*
drwxr-xr-x 11 root     root      4096 Aug 25 17:31 src/
drwxr-xr-x  7 root     root      4096 Sep  2 22:44 src-tauri/
-rw-r--r--  1 root     root       894 Aug  5 18:12 tsconfig.json
-rw-r--r--  1 root     root       212 Aug  5 18:12 tsconfig.node.json
-rwxr-xr-x  1 root     root      2350 Sep  1 18:17 verify_implementation.sh*
-rw-r--r--  1 root     root       451 Aug  5 18:12 vite.config.ts
total 252
drwxr-xr-x 13 root     root      4096 Sep  6 15:46 ./
drwxr-xr-x 12 root     root      4096 Sep  2 21:56 ../
-rwxr-xr-x  1 root     root     17990 Aug 23 19:40 build-manager.sh*
drwxr-xr-x  4 root     root      4096 Aug 10 15:11 builds/
drwxr-xr-x  2 root     root      4096 Sep  1 23:42 .claude/
-rw-r--r--  1 root     root     21944 Aug 25 17:33 demo.html
drwxr-xr-x  3 root     root      4096 Sep  6 15:41 dist/
drwxr-xr-x 11 www-data www-data  4096 Aug 24 15:54 docs/
drwxr-xr-x  8 root     root      4096 Sep  6 15:07 .git/
drwxr-xr-x  3 root     root      4096 Aug  7 17:09 .gitee/
drwxr-xr-x  3 root     root      4096 Aug 19 17:37 .github/
-rw-r--r--  1 root     root      8579 Aug 19 17:41 GITHUB_ACTIONS_SETUP_GUIDE.md
-rw-r--r--  1 root     root      1608 Aug 19 16:17 .gitignore
-rw-r--r--  1 root     root       368 Aug  5 18:20 index.html
-rw-r--r--  1 root     root         0 Sep  6 16:02 .last-rust-build
-rw-r--r--  1 root     root         0 Sep  6 15:41 .last-web-build
-rwxr-xr-x  1 root     root      2707 Aug 27 19:39 mysql_proxy.py*
drwxr-xr-x 51 root     root      4096 Aug 28 08:49 node_modules/
-rw-r--r--  1 root     root       479 Aug  5 18:12 package.json
-rw-r--r--  1 root     root     62581 Aug 19 16:20 package-lock.json
-rwxr-xr-x  1 root     root      4869 Aug 20 16:27 package-subtle-selection.sh*
-rwxr-xr-x  1 root     root      6543 Aug 20 18:10 package-tech-debt-cleaned.sh*
-rwxr-xr-x  1 root     root      6668 Aug 20 19:05 package-text-bold-fix.sh*
-rwxr-xr-x  1 root     root      6425 Aug 20 14:46 package-typography-fixes.sh*
-rw-r--r--  1 root     root      9070 Aug 19 16:18 README.md
drwxr-xr-x  3 root     root      4096 Aug 26 12:03 scripts/
-rwxr-xr-x  1 root     root      2625 Aug 19 17:41 setup-github-actions.sh*
drwxr-xr-x 11 root     root      4096 Aug 25 17:31 src/
drwxr-xr-x  7 root     root      4096 Sep  2 22:44 src-tauri/
-rw-r--r--  1 root     root       894 Aug  5 18:12 tsconfig.json
-rw-r--r--  1 root     root       212 Aug  5 18:12 tsconfig.node.json
-rwxr-xr-x  1 root     root      2350 Sep  1 18:17 verify_implementation.sh*
-rw-r--r--  1 root     root       451 Aug  5 18:12 vite.config.ts
total 252
drwxr-xr-x 13 root     root      4096 Sep  6 15:46 ./
drwxr-xr-x 12 root     root      4096 Sep  2 21:56 ../
-rwxr-xr-x  1 root     root     17990 Aug 23 19:40 build-manager.sh*
drwxr-xr-x  4 root     root      4096 Aug 10 15:11 builds/
drwxr-xr-x  2 root     root      4096 Sep  1 23:42 .claude/
-rw-r--r--  1 root     root     21944 Aug 25 17:33 demo.html
drwxr-xr-x  3 root     root      4096 Sep  6 15:41 dist/
drwxr-xr-x 11 www-data www-data  4096 Aug 24 15:54 docs/
drwxr-xr-x  8 root     root      4096 Sep  6 15:07 .git/
drwxr-xr-x  3 root     root      4096 Aug  7 17:09 .gitee/
drwxr-xr-x  3 root     root      4096 Aug 19 17:37 .github/
-rw-r--r--  1 root     root      8579 Aug 19 17:41 GITHUB_ACTIONS_SETUP_GUIDE.md
-rw-r--r--  1 root     root      1608 Aug 19 16:17 .gitignore
-rw-r--r--  1 root     root       368 Aug  5 18:20 index.html
-rw-r--r--  1 root     root         0 Sep  6 16:02 .last-rust-build
-rw-r--r--  1 root     root         0 Sep  6 15:41 .last-web-build
-rwxr-xr-x  1 root     root      2707 Aug 27 19:39 mysql_proxy.py*
drwxr-xr-x 51 root     root      4096 Aug 28 08:49 node_modules/
-rw-r--r--  1 root     root       479 Aug  5 18:12 package.json
-rw-r--r--  1 root     root     62581 Aug 19 16:20 package-lock.json
-rwxr-xr-x  1 root     root      4869 Aug 20 16:27 package-subtle-selection.sh*
-rwxr-xr-x  1 root     root      6543 Aug 20 18:10 package-tech-debt-cleaned.sh*
-rwxr-xr-x  1 root     root      6668 Aug 20 19:05 package-text-bold-fix.sh*
-rwxr-xr-x  1 root     root      6425 Aug 20 14:46 package-typography-fixes.sh*
-rw-r--r--  1 root     root      9070 Aug 19 16:18 README.md
drwxr-xr-x  3 root     root      4096 Aug 26 12:03 scripts/
-rwxr-xr-x  1 root     root      2625 Aug 19 17:41 setup-github-actions.sh*
drwxr-xr-x 11 root     root      4096 Aug 25 17:31 src/
drwxr-xr-x  7 root     root      4096 Sep  2 22:44 src-tauri/
-rw-r--r--  1 root     root       894 Aug  5 18:12 tsconfig.json
-rw-r--r--  1 root     root       212 Aug  5 18:12 tsconfig.node.json
-rwxr-xr-x  1 root     root      2350 Sep  1 18:17 verify_implementation.sh*
-rw-r--r--  1 root     root       451 Aug  5 18:12 vite.config.ts
total 56
drwxr-xr-x 12 root root 4096 Sep  2 21:56 ./
drwx------ 17 root root 4096 Sep  6 16:25 ../
drwxr-xr-x  3 root root 4096 Aug 19 17:47 chrom/
drwxr-xr-x  2 root root 4096 Jul 30 23:21 .claude/
drwxr-xr-x  3 root root 4096 Aug 12 12:48 excel/
drwxr-xr-x  2 root root 4096 Aug  3 14:25 hd/
drwxr-xr-x 13 root root 4096 Sep  6 15:46 jasper/
drwxr-xr-x 10 root root 4096 Aug 31 22:18 ms/
drwxr-xr-x  3 root root 4096 Sep  2 23:14 pcc/
-rw-r--r--  1 root root 5506 Aug 30 13:06 README.md
drwxr-xr-x  7 root root 4096 Sep  2 12:01 table/
drwxr-xr-x 12 root root 4096 Sep  6 15:49 wx/
drwxr-xr-x  9 root root 4096 Jul 31 23:10 yi/
total 580
drwx------ 17 root root   4096 Sep  6 16:25 ./
drwxr-xr-x 27 root root   4096 Sep  6 16:29 ../
-rw-------  1 root root   8317 Sep  6 16:29 .bash_history
-rw-r--r--  1 root root   3127 Aug  6 11:11 .bashrc
drwxr-xr-x  8 root root   4096 Aug 19 19:33 .cache/
drwxr-xr-x  4 root root   4096 Sep  6 16:21 .cargo/
drwxr-xr-x  8 root root   4096 Sep  6 15:33 .claude/
-rw-r--r--  1 root root 168447 Sep  6 16:25 .claude.json
-rw-r--r--  1 root root 168360 Sep  6 16:25 .claude.json.backup
-rw-r--r--  1 root root     45 Aug  3 20:31 client_privatekey
-rw-r--r--  1 root root     45 Aug  3 20:31 client_publickey
drwxr-xr-x  6 root root   4096 Aug 31 11:00 .config/
-rw-r--r--  1 root root    133 Aug 31 14:18 env2.txt
-rw-r--r--  1 root root    151 Aug 31 00:02 env.txt
-rw-r--r--  1 root root     53 Jul 31 21:08 .gitconfig
drwxr-xr-x  3 root root   4096 Aug 28 09:44 .java/
drwxr-xr-x  3 root root   4096 Aug  3 21:25 .local/
drwxr-xr-x  3 root root   4096 Jul 30 21:06 .m2/
-rw-------  1 root root     58 Jul 30 20:46 .my.cnf
-rw-------  1 root root     18 Aug 27 14:07 .mysql_history
drwxr-xr-x  5 root root   4096 Aug 23 17:06 .npm/
drwxr-xr-x  2 root root   4096 Apr 28  2024 .pip/
drwx------  3 root root   4096 Aug 19 19:33 .pki/
-rw-r--r--  1 root root    231 Aug  9 15:52 .profile
drwxr-xr-x 12 root root   4096 Sep  2 21:56 project/
-rw-r--r--  1 root root     73 Jul 30 20:14 .pydistutils.cfg
-rw-r--r--  1 root root   2306 Aug 19 18:25 README_novnc.md
drwxr-xr-x  6 root root   4096 Aug  6 11:11 .rustup/
drwx------  3 root root   4096 Aug 19 17:51 snap/
drwx------  2 root root   4096 Aug 19 19:58 .ssh/
-rwxr-xr-x  1 root root   1195 Aug 19 18:23 start_novnc.sh*
-rwxr-xr-x  1 root root   2744 Aug 19 18:24 status_novnc.sh*
-rwxr-xr-x  1 root root   1351 Aug 19 18:23 stop_novnc.sh*
-rw-------  1 root root   7133 Aug 31 14:18 .viminfo
drwx------  2 root root   4096 Aug 20 10:20 .vnc/
-rw-r--r--  1 root root    305 Aug 29 21:42 .wget-hsts
-rw-r--r--  1 root root  87360 Jan  7  2022 wireguard-installer.exe
-rw-------  1 root root    108 Aug 19 19:07 .Xauthority
-rw-------  1 root root   2242 Aug 20 10:20 .xsession-errors
total 580
drwx------ 17 root root   4096 Sep  6 16:25 ./
drwxr-xr-x 27 root root   4096 Sep  6 16:29 ../
-rw-------  1 root root   8320 Sep  6 16:29 .bash_history
-rw-r--r--  1 root root   3127 Aug  6 11:11 .bashrc
drwxr-xr-x  8 root root   4096 Aug 19 19:33 .cache/
drwxr-xr-x  4 root root   4096 Sep  6 16:21 .cargo/
drwxr-xr-x  8 root root   4096 Sep  6 15:33 .claude/
-rw-r--r--  1 root root 168447 Sep  6 16:25 .claude.json
-rw-r--r--  1 root root 168360 Sep  6 16:25 .claude.json.backup
-rw-r--r--  1 root root     45 Aug  3 20:31 client_privatekey
-rw-r--r--  1 root root     45 Aug  3 20:31 client_publickey
drwxr-xr-x  6 root root   4096 Aug 31 11:00 .config/
-rw-r--r--  1 root root    133 Aug 31 14:18 env2.txt
-rw-r--r--  1 root root    151 Aug 31 00:02 env.txt
-rw-r--r--  1 root root     53 Jul 31 21:08 .gitconfig
drwxr-xr-x  3 root root   4096 Aug 28 09:44 .java/
drwxr-xr-x  3 root root   4096 Aug  3 21:25 .local/
drwxr-xr-x  3 root root   4096 Jul 30 21:06 .m2/
-rw-------  1 root root     58 Jul 30 20:46 .my.cnf
-rw-------  1 root root     18 Aug 27 14:07 .mysql_history
drwxr-xr-x  5 root root   4096 Aug 23 17:06 .npm/
drwxr-xr-x  2 root root   4096 Apr 28  2024 .pip/
drwx------  3 root root   4096 Aug 19 19:33 .pki/
-rw-r--r--  1 root root    231 Aug  9 15:52 .profile
drwxr-xr-x 12 root root   4096 Sep  2 21:56 project/
-rw-r--r--  1 root root     73 Jul 30 20:14 .pydistutils.cfg
-rw-r--r--  1 root root   2306 Aug 19 18:25 README_novnc.md
drwxr-xr-x  6 root root   4096 Aug  6 11:11 .rustup/
drwx------  3 root root   4096 Aug 19 17:51 snap/
drwx------  2 root root   4096 Aug 19 19:58 .ssh/
-rwxr-xr-x  1 root root   1195 Aug 19 18:23 start_novnc.sh*
-rwxr-xr-x  1 root root   2744 Aug 19 18:24 status_novnc.sh*
-rwxr-xr-x  1 root root   1351 Aug 19 18:23 stop_novnc.sh*
-rw-------  1 root root   7133 Aug 31 14:18 .viminfo
drwx------  2 root root   4096 Aug 20 10:20 .vnc/
-rw-r--r--  1 root root    305 Aug 29 21:42 .wget-hsts
-rw-r--r--  1 root root  87360 Jan  7  2022 wireguard-installer.exe
-rw-------  1 root root    108 Aug 19 19:07 .Xauthority
-rw-------  1 root root   2242 Aug 20 10:20 .xsession-errors
total 2039901
drwxr-xr-x  27 root root       4096 Sep  6 16:29 ./
drwxr-xr-x  27 root root       4096 Sep  6 16:29 ../
drwxr-xr-x   2 root root       4096 Aug 19 16:37 assets/
-rw-r--r--   1 root root          0 Jul 30 20:14 .autorelabel
lrwxrwxrwx   1 root root          7 Apr 22  2024 bin -> usr/bin/
drwxr-xr-x   2 root root       4096 Feb 26  2024 bin.usr-is-merged/
drwxr-xr-x   3 root root       4096 Aug 29 22:24 boot/
dr-xr-xr-x   2 root root       4096 Apr 23  2024 cdrom/
drwxr-xr-x   3 root root       4096 Aug  3 13:12 data/
drwxr-xr-x  19 root root       4060 Aug 29 22:22 dev/
drwxr-xr-x 153 root root      12288 Aug 29 22:28 etc/
drwxr-xr-x   4 root root       4096 Jul 30 20:14 home/
drwxr-xr-x   2 root root       4096 Aug 19 16:37 icons/
-rw-r--r--   1 root root        466 Aug 19 16:56 index.html
-rwxr-xr-x   1 root root    4068384 Aug 19 16:37 jasper-designer-linux*
drwxrwxrwx   1 root root          0 Jan  1  1970 lhcos-data/
lrwxrwxrwx   1 root root          7 Apr 22  2024 lib -> usr/lib/
lrwxrwxrwx   1 root root          9 Apr 22  2024 lib64 -> usr/lib64/
drwxr-xr-x   2 root root       4096 Feb 26  2024 lib.usr-is-merged/
drwx------   2 root root      16384 Apr 26  2024 lost+found/
drwxr-xr-x   2 root root       4096 Apr 23  2024 media/
drwxr-xr-x   2 root root       4096 Apr 23  2024 mnt/
drwxr-xr-x   3 root root       4096 Aug 19 19:31 opt/
dr-xr-xr-x 226 root root          0 Aug 29 22:21 proc/
-rw-r--r--   1 root root       4688 Aug  9 16:10 README-M3-PHASE1.md
drwx------  17 root root       4096 Sep  6 16:25 root/
drwxr-xr-x  42 root root       1420 Sep  6 11:12 run/
-rw-r--r--   1 root root        595 Aug  9 16:10 run-jasper.bat
lrwxrwxrwx   1 root root          8 Apr 22  2024 sbin -> usr/sbin/
drwxr-xr-x   2 root root       4096 Apr  3  2024 sbin.usr-is-merged/
drwxr-xr-x   9 root root       4096 Aug 19 17:51 snap/
drwxr-xr-x   2 root root       4096 Apr 23  2024 srv/
-rw-------   1 root root 2084569088 Apr 26  2024 swap.img
dr-xr-xr-x  13 root root          0 Aug 29 22:21 sys/
drwxrwxrwt  26 root root      86016 Sep  6 16:27 tmp/
drwxr-xr-x  15 root root       4096 Aug  9 18:08 usr/
drwxr-xr-x  15 root root       4096 Aug 29 22:21 var/
total 2039901
drwxr-xr-x  27 root root       4096 Sep  6 16:31 ./
drwxr-xr-x  27 root root       4096 Sep  6 16:31 ../
drwxr-xr-x   2 root root       4096 Aug 19 16:37 assets/
-rw-r--r--   1 root root          0 Jul 30 20:14 .autorelabel
lrwxrwxrwx   1 root root          7 Apr 22  2024 bin -> usr/bin/
drwxr-xr-x   2 root root       4096 Feb 26  2024 bin.usr-is-merged/
drwxr-xr-x   3 root root       4096 Aug 29 22:24 boot/
dr-xr-xr-x   2 root root       4096 Apr 23  2024 cdrom/
drwxr-xr-x   3 root root       4096 Aug  3 13:12 data/
drwxr-xr-x  19 root root       4060 Aug 29 22:22 dev/
drwxr-xr-x 153 root root      12288 Aug 29 22:28 etc/
drwxr-xr-x   4 root root       4096 Jul 30 20:14 home/
drwxr-xr-x   2 root root       4096 Aug 19 16:37 icons/
-rw-r--r--   1 root root        466 Aug 19 16:56 index.html
-rwxr-xr-x   1 root root    4068384 Aug 19 16:37 jasper-designer-linux*
drwxrwxrwx   1 root root          0 Jan  1  1970 lhcos-data/
lrwxrwxrwx   1 root root          7 Apr 22  2024 lib -> usr/lib/
lrwxrwxrwx   1 root root          9 Apr 22  2024 lib64 -> usr/lib64/
drwxr-xr-x   2 root root       4096 Feb 26  2024 lib.usr-is-merged/
drwx------   2 root root      16384 Apr 26  2024 lost+found/
drwxr-xr-x   2 root root       4096 Apr 23  2024 media/
drwxr-xr-x   2 root root       4096 Apr 23  2024 mnt/
drwxr-xr-x   3 root root       4096 Aug 19 19:31 opt/
dr-xr-xr-x 229 root root          0 Aug 29 22:21 proc/
-rw-r--r--   1 root root       4688 Aug  9 16:10 README-M3-PHASE1.md
drwx------  17 root root       4096 Sep  6 16:25 root/
drwxr-xr-x  42 root root       1420 Sep  6 11:12 run/
-rw-r--r--   1 root root        595 Aug  9 16:10 run-jasper.bat
lrwxrwxrwx   1 root root          8 Apr 22  2024 sbin -> usr/sbin/
drwxr-xr-x   2 root root       4096 Apr  3  2024 sbin.usr-is-merged/
drwxr-xr-x   9 root root       4096 Aug 19 17:51 snap/
drwxr-xr-x   2 root root       4096 Apr 23  2024 srv/
-rw-------   1 root root 2084569088 Apr 26  2024 swap.img
dr-xr-xr-x  13 root root          0 Sep  6 16:29 sys/
drwxrwxrwt  26 root root      86016 Sep  6 16:31 tmp/
drwxr-xr-x  15 root root       4096 Aug  9 18:08 usr/
drwxr-xr-x  15 root root       4096 Aug 29 22:21 var/

### 依赖精简


---
构建时间: Sat Sep  6 04:31:48 PM CST 2025  
优化版本: v2.0-optimized
