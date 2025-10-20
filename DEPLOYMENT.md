# Canadian SMS Pilot - VPS Deployment Guide

This guide will help you deploy the Canadian SMS Pilot application to your VPS using Docker and Nginx.

## Prerequisites

- Ubuntu 20.04+ or similar Linux distribution
- Root or sudo access to your VPS
- Domain name (optional, for SSL)
- Basic knowledge of Linux commands

## Quick Deployment

### Option 1: Automated Deployment (Recommended)

1. **Upload your code to the VPS:**
   ```bash
   # On your local machine
   scp -r . user@your-vps-ip:/opt/canadian-sms-pilot
   ```

2. **SSH into your VPS:**
   ```bash
   ssh user@your-vps-ip
   ```

3. **Make the deployment script executable and run it:**
   ```bash
   cd /opt/canadian-sms-pilot
   chmod +x deploy.sh
   ./deploy.sh
   ```

4. **Follow the prompts** to complete the deployment.

### Option 2: Manual Deployment

#### Step 1: Update System and Install Dependencies

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git nginx certbot python3-certbot-nginx ufw
```

#### Step 2: Install Docker

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

**Important:** Log out and log back in for Docker group changes to take effect.

#### Step 3: Configure Firewall

```bash
sudo ufw --force enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
```

#### Step 4: Deploy Application

```bash
# Create application directory
sudo mkdir -p /opt/canadian-sms-pilot
sudo chown $USER:$USER /opt/canadian-sms-pilot

# Copy your application files to the VPS
# (Upload your code using scp, git clone, or any preferred method)

# Navigate to application directory
cd /opt/canadian-sms-pilot

# Configure environment variables
cp env.production .env
# Edit .env file with your actual values
nano .env

# Build and start the application
docker-compose build --no-cache
docker-compose up -d
```

#### Step 5: Setup SSL (Optional but Recommended)

If you have a domain name:

```bash
sudo certbot --nginx -d your-domain.com --non-interactive --agree-tos --email your-email@example.com
```

#### Step 6: Create Systemd Service (Optional)

```bash
sudo tee /etc/systemd/system/canadian-sms-pilot.service > /dev/null <<EOF
[Unit]
Description=Canadian SMS Pilot Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/canadian-sms-pilot
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0
User=$USER

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable canadian-sms-pilot
```

## Environment Configuration

Before deploying, make sure to configure your environment variables in the `.env` file:

```bash
# Copy the production environment template
cp env.production .env

# Edit with your actual values
nano .env
```

### Required Environment Variables

- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `VITE_API_BASE_URL`: Your API base URL (if applicable)

## Application Management

### Start/Stop Application

```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# Restart
docker-compose restart
```

### View Logs

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f app
```

### Update Application

```bash
# Pull latest changes (if using git)
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Check Application Status

```bash
# Check if containers are running
docker-compose ps

# Check systemd service status
sudo systemctl status canadian-sms-pilot
```

## Troubleshooting

### Common Issues

1. **Port 80 already in use:**
   ```bash
   sudo netstat -tulpn | grep :80
   sudo systemctl stop nginx  # if nginx is running
   ```

2. **Docker permission denied:**
   ```bash
   sudo usermod -aG docker $USER
   # Log out and log back in
   ```

3. **Application not accessible:**
   - Check firewall: `sudo ufw status`
   - Check if containers are running: `docker-compose ps`
   - Check logs: `docker-compose logs`

4. **SSL certificate issues:**
   ```bash
   sudo certbot certificates
   sudo certbot renew --dry-run
   ```

### Performance Optimization

1. **Enable Nginx caching:**
   The nginx.conf already includes caching for static assets.

2. **Monitor resource usage:**
   ```bash
   docker stats
   ```

3. **Scale application (if needed):**
   ```bash
   docker-compose up -d --scale app=2
   ```

## Security Considerations

1. **Keep system updated:**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **Regular security updates:**
   ```bash
   sudo unattended-upgrades
   ```

3. **Monitor logs:**
   ```bash
   tail -f /var/log/nginx/access.log
   tail -f /var/log/nginx/error.log
   ```

4. **Backup configuration:**
   ```bash
   sudo cp -r /opt/canadian-sms-pilot /opt/canadian-sms-pilot-backup
   ```

## Monitoring and Maintenance

### Health Checks

```bash
# Check if application is responding
curl -I http://your-domain.com

# Check SSL certificate
curl -I https://your-domain.com
```

### Backup Strategy

1. **Application data:**
   ```bash
   sudo tar -czf backup-$(date +%Y%m%d).tar.gz /opt/canadian-sms-pilot
   ```

2. **Database (if applicable):**
   ```bash
   # Add your database backup commands here
   ```

### Log Rotation

```bash
sudo nano /etc/logrotate.d/canadian-sms-pilot
```

Add:
```
/opt/canadian-sms-pilot/logs/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
}
```

## Support

If you encounter issues:

1. Check the logs: `docker-compose logs -f`
2. Verify environment variables: `cat .env`
3. Check system resources: `htop` or `docker stats`
4. Verify network connectivity: `curl -I http://localhost`

For additional help, refer to the application logs and Docker documentation.
