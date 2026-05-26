const dns = require('dns');
const mongoose = require('mongoose');

/**
 * Khi dùng URI dạng `mongodb+srv://...`, Node phải query SRV record.
 * Một số DNS local (router/ISP/VPN) chặn SRV → lỗi `querySrv ECONNREFUSED`.
 * Ép resolver sang Google + Cloudflare để tránh tình trạng này.
 */
function ensurePublicDnsServers() {
  try {
    const current = dns.getServers();
    const fallbacks = ['8.8.8.8', '1.1.1.1', '8.8.4.4'];
    const merged = Array.from(new Set([...current, ...fallbacks]));
    dns.setServers(merged);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('⚠️  Cannot override DNS servers:', err.message);
  }
}

function describeMongoError(err) {
  const msg = err && err.message ? err.message : String(err);

  if (/querySrv|ESERVFAIL|ENOTFOUND|ECONNREFUSED.*_mongodb/i.test(msg)) {
    return [
      'DNS không phân giải được SRV record của MongoDB Atlas.',
      '→ Kiểm tra mạng/VPN, hoặc đổi MONGODB_URI sang dạng multi-host (không dùng `mongodb+srv://`).',
      '→ Có thể đổi DNS máy sang 8.8.8.8 / 1.1.1.1 rồi thử lại.',
    ].join(' ');
  }
  if (/Authentication failed|bad auth|SCRAM/i.test(msg)) {
    return 'Sai username/password trong MONGODB_URI hoặc user chưa có quyền với database.';
  }
  if (/IP that isn'?t whitelisted|not allowed to connect|whitelist/i.test(msg)) {
    return 'IP hiện tại chưa được whitelist trong MongoDB Atlas (Network Access).';
  }
  if (/ETIMEDOUT|ENETUNREACH|connect ECONNREFUSED/i.test(msg)) {
    return 'Không kết nối được tới MongoDB (firewall/mạng/cluster paused).';
  }
  return msg;
}

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not defined in environment variables');
  }

  if (uri.startsWith('mongodb+srv://')) {
    ensurePublicDnsServers();
  }

  mongoose.set('strictQuery', true);

  const maxAttempts = 3;
  let lastErr;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
      });

      // eslint-disable-next-line no-console
      console.log(
        `🍃  MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`,
      );
      return;
    } catch (err) {
      lastErr = err;
      // eslint-disable-next-line no-console
      console.warn(
        `⚠️  MongoDB connect attempt ${attempt}/${maxAttempts} failed: ${describeMongoError(err)}`,
      );
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 1500 * attempt));
      }
    }
  }

  const friendly = describeMongoError(lastErr);
  const error = new Error(`MongoDB connect failed after ${maxAttempts} attempts: ${friendly}`);
  error.cause = lastErr;
  throw error;
}

module.exports = connectDB;
