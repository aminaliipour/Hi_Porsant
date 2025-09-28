// تست اتصال SSH به VPS
import { Client } from 'ssh2';

const testSSHConnection = () => {
  const conn = new Client();
  
  conn.on('ready', () => {
    console.log('SSH Connection established successfully!');
    
    // تست ایجاد پوشه
    conn.exec('mkdir -p /root/hiarchitectweb/public/files/test', (err: any, stream: any) => {
      if (err) {
        console.error('Error creating test directory:', err);
        conn.end();
        return;
      }
      
      stream.on('close', (code: number) => {
        console.log('Test directory creation result:', code);
        
        // تست لیست فایل‌ها
        conn.exec('ls -la /root/hiarchitectweb/public/files/', (err: any, stream: any) => {
          if (err) {
            console.error('Error listing files:', err);
            conn.end();
            return;
          }
          
          stream.on('data', (data: any) => {
            console.log('Directory contents:', data.toString());
          });
          
          stream.on('close', () => {
            console.log('SSH test completed');
            conn.end();
          });
        });
      });
    });
  });
  
  conn.on('error', (err: any) => {
    console.error('SSH connection error:', err);
  });
  
  conn.connect({
    host: '62.60.198.209',
    port: 22,
    username: 'root',
    password: '1muys'
  });
};

// اجرای تست
// testSSHConnection();

export { testSSHConnection };