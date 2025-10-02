#!/bin/bash

# Canadian SMS Pilot Deployment Script
# This script automates the deployment process on your VPS

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="canadian-sms-pilot"
APP_DIR="/opt/$APP_NAME"
SERVICE_USER="www-data"
DOMAIN=""

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        print_error "This script should not be run as root. Please run as a regular user with sudo privileges."
        exit 1
    fi
}

# Update system packages
update_system() {
    print_status "Updating system packages..."
    sudo apt update && sudo apt upgrade -y
    sudo apt install -y curl wget git nginx certbot python3-certbot-nginx ufw
}

# Install Docker
install_docker() {
    print_status "Installing Docker..."
    
    # Remove old versions
    sudo apt remove -y docker docker-engine docker.io containerd runc
    
    # Install Docker
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    rm get-docker.sh
    
    # Add user to docker group
    sudo usermod -aG docker $USER
    
    # Install Docker Compose
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    
    print_status "Docker installed successfully. Please log out and log back in for group changes to take effect."
}

# Setup firewall
setup_firewall() {
    print_status "Configuring firewall..."
    sudo ufw --force enable
    sudo ufw allow ssh
    sudo ufw allow 80
    sudo ufw allow 443
    print_status "Firewall configured successfully."
}

# Create application directory
setup_app_directory() {
    print_status "Setting up application directory..."
    sudo mkdir -p $APP_DIR
    sudo chown $USER:$USER $APP_DIR
}

# Deploy application
deploy_app() {
    print_status "Deploying application..."
    
    # Copy application files
    cp -r . $APP_DIR/
    cd $APP_DIR
    
    # Set proper permissions
    sudo chown -R $USER:$USER $APP_DIR
    
    # Build and start the application
    docker-compose down || true
    docker-compose build --no-cache
    docker-compose up -d
    
    print_status "Application deployed successfully!"
}

# Setup SSL certificate
setup_ssl() {
    if [[ -n "$DOMAIN" ]]; then
        print_status "Setting up SSL certificate for $DOMAIN..."
        sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN
        print_status "SSL certificate configured successfully!"
    else
        print_warning "No domain specified. SSL setup skipped."
    fi
}

# Create systemd service
create_service() {
    print_status "Creating systemd service..."
    
    sudo tee /etc/systemd/system/$APP_NAME.service > /dev/null <<EOF
[Unit]
Description=Canadian SMS Pilot Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$APP_DIR
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0
User=$USER

[Install]
WantedBy=multi-user.target
EOF

    sudo systemctl daemon-reload
    sudo systemctl enable $APP_NAME
    print_status "Systemd service created and enabled."
}

# Main deployment function
main() {
    print_status "Starting Canadian SMS Pilot deployment..."
    
    # Get domain from user if not set
    if [[ -z "$DOMAIN" ]]; then
        read -p "Enter your domain name (or press Enter to skip SSL setup): " DOMAIN
    fi
    
    check_root
    update_system
    install_docker
    setup_firewall
    setup_app_directory
    deploy_app
    create_service
    
    if [[ -n "$DOMAIN" ]]; then
        setup_ssl
    fi
    
    print_status "Deployment completed successfully!"
    print_status "Your application should be available at:"
    if [[ -n "$DOMAIN" ]]; then
        echo "  https://$DOMAIN"
    else
        echo "  http://$(curl -s ifconfig.me)"
    fi
    print_status "To check application status: sudo systemctl status $APP_NAME"
    print_status "To view logs: docker-compose logs -f"
}

# Run main function
main "$@"
