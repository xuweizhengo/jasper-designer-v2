#!/usr/bin/env python3
import socket
import threading
import time

def handle_client(client_socket, mysql_host='127.0.0.1', mysql_port=3306):
    """处理客户端连接，转发到MySQL"""
    try:
        # 连接到MySQL服务器
        mysql_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        mysql_socket.connect((mysql_host, mysql_port))
        print(f"🔗 客户端连接已转发到MySQL {mysql_host}:{mysql_port}")
        
        # 创建两个线程进行双向数据转发
        def forward_data(source, destination, name):
            try:
                while True:
                    data = source.recv(4096)
                    if not data:
                        break
                    destination.send(data)
            except:
                pass
            finally:
                source.close()
                destination.close()
                print(f"📤 {name} 连接已关闭")
        
        # 客户端 -> MySQL
        thread1 = threading.Thread(target=forward_data, args=(client_socket, mysql_socket, "客户端->MySQL"))
        # MySQL -> 客户端  
        thread2 = threading.Thread(target=forward_data, args=(mysql_socket, client_socket, "MySQL->客户端"))
        
        thread1.daemon = True
        thread2.daemon = True
        thread1.start()
        thread2.start()
        
        thread1.join()
        thread2.join()
        
    except Exception as e:
        print(f"❌ 转发错误: {e}")
        client_socket.close()

def start_mysql_proxy(proxy_port=13306):
    """启动MySQL TCP代理服务器"""
    server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    
    try:
        server_socket.bind(('0.0.0.0', proxy_port))
        server_socket.listen(5)
        print(f"🚀 MySQL代理服务器启动在端口 {proxy_port}")
        print(f"🔄 所有连接将转发到 127.0.0.1:3306")
        print("📋 使用 Ctrl+C 停止服务")
        
        while True:
            client_socket, client_address = server_socket.accept()
            print(f"🌐 新连接来自: {client_address}")
            
            # 为每个客户端连接创建新线程
            client_thread = threading.Thread(
                target=handle_client, 
                args=(client_socket,)
            )
            client_thread.daemon = True
            client_thread.start()
            
    except KeyboardInterrupt:
        print("\n🛑 代理服务器已停止")
    except Exception as e:
        print(f"❌ 服务器错误: {e}")
    finally:
        server_socket.close()

if __name__ == "__main__":
    start_mysql_proxy()