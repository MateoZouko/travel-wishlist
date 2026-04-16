# Travel Wishlist

A full-stack 3-tier web application to manage travel destinations.

**Live:** https://d275jdcunrc9qo.cloudfront.net

---

## Features

- **CRUD** — Create, read, update and delete travel destinations
- **State Management** — React Context API for global state across list view, map view, filters and search
- **External API** — RestCountries API enriches each destination with capital city, currency and country flag
- **PostgreSQL** — Data persisted using raw SQL and stored procedures (no ORM)
- **AWS Deployment** — Follows the 6 pillars of the AWS Well-Architected Framework

### Frontend
- **List view** — destination cards with flag, capital, currency and status badge
- **Map view** — interactive world map (CartoDB tiles) with color-coded pins by status, side panel and fly-to animation on click
- **Filter tabs** — filter by All / Wishlist / Planned / Visited
- **Search** — real-time search by destination name or country
- **Sort** — by date added, name or status
- **Progress bar** — tracks % of destinations visited
- **Stats bar** — live counts per status
- **Mark as visited** — one-click status update directly from the card
- **Toast notifications** — feedback on every CRUD operation
- **Dark mode** — toggle with localStorage persistence
- **Animations** — cards fade in on load, hover shadow effect

---

## Architecture

```
Users (HTTPS)
     │
     ▼
 CloudFront
  ├── /* ──────────────► S3 (React static build)
  └── /api/* ──────────► EC2 t3.micro (Flask + Gunicorn)
                              │
                              ▼ (private subnet)
                        RDS PostgreSQL t3.micro
```

### AWS Resources

| Resource | Details |
|----------|---------|
| CloudFront | CDN + HTTPS termination, routes `/api/*` to EC2 |
| S3 | Hosts the React production build |
| EC2 (t3.micro) | Flask API managed by Gunicorn + systemd |
| RDS (db.t3.micro) | PostgreSQL 15 in a private subnet |
| VPC | Public subnet (EC2) + private subnet (RDS) |
| Security Groups | RDS only accepts traffic from EC2 on port 5432 |

### AWS Well-Architected Framework

| Pillar | Implementation |
|--------|---------------|
| Operational Excellence | systemd service with auto-restart, `/health` endpoint |
| Security | HTTPS via CloudFront, RDS in private subnet, Security Groups, no hardcoded credentials |
| Reliability | RDS managed backups, Gunicorn multi-worker, `wait_for_db` on startup |
| Performance Efficiency | CloudFront CDN for static assets, right-sized instances |
| Cost Optimization | Free Tier instances, S3 for static hosting |
| Sustainability | Minimal resource footprint, no over-provisioning |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Context API |
| Backend | Python 3, Flask, Gunicorn |
| Database | PostgreSQL 15 |
| Infrastructure | AWS (EC2, RDS, S3, CloudFront, VPC) |
| Local dev | Docker, Docker Compose |

---

## Local Setup

### Prerequisites

- Docker and Docker Compose

### Run locally

```bash
git clone https://github.com/MateoZouko/travel-wishlist.git
cd travel-wishlist
docker compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost |
| Backend API | http://localhost:5000/api |

### Environment variables (backend)

The backend reads the following variables from a `.env` file in the project root:

```env
# DB_HOST is set to "db" because Docker Compose creates an internal network
# where each service is reachable by its service name defined in docker-compose.yml
# In production (EC2), DB_HOST points to the actual RDS endpoint
DB_HOST=db
DB_PORT=5432
DB_NAME=traveldb
DB_USER=postgres
DB_PASSWORD=postgres
```

These are already set via `docker-compose.yml` for local development. For production, set them on the server directly.

---

## API Reference

Base URL (production): `https://d275jdcunrc9qo.cloudfront.net/api`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/destinations` | List all destinations |
| GET | `/destinations/:id` | Get a single destination |
| POST | `/destinations` | Create a destination |
| PUT | `/destinations/:id` | Update a destination |
| DELETE | `/destinations/:id` | Delete a destination |
| GET | `/health` | Health check |

### POST /destinations — Request body

```json
{
  "name": "Tokyo",
  "country": "Japan",
  "notes": "Visit in spring",
  "status": "wishlist"
}
```

`status` accepts: `wishlist`, `planned`, `visited`

### Response

```json
{
  "id": 1,
  "name": "Tokyo",
  "country": "Japan",
  "notes": "Visit in spring",
  "status": "wishlist",
  "capital": "Tokyo",
  "currency": "JPY",
  "flag_url": "https://flagcdn.com/w320/jp.png",
  "created_at": "2026-04-15 21:00:00"
}
```

---

## Testing

### Backend unit tests

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m pytest tests/ -v
```

All endpoints are covered with mocked database connections:
- `GET /api/destinations` — empty list and populated list
- `GET /api/destinations/:id` — found and not found
- `POST /api/destinations` — successful creation
- `PUT /api/destinations/:id` — successful update and not found
- `DELETE /api/destinations/:id` — successful deletion
- `GET /health` — health check
- `enrich_with_country_data` — fallback on external API failure

### Manual API testing

With the app running locally (`docker compose up --build`):

```bash
# Create a destination
curl -s -X POST http://localhost:5000/api/destinations \
  -H "Content-Type: application/json" \
  -d '{"name": "Tokyo", "country": "Japan", "notes": "Visit in spring", "status": "wishlist"}'

# List all destinations
curl -s http://localhost:5000/api/destinations

# Update a destination
curl -s -X PUT http://localhost:5000/api/destinations/1 \
  -H "Content-Type: application/json" \
  -d '{"name": "Tokyo", "country": "Japan", "notes": "Updated notes", "status": "planned"}'

# Delete a destination
curl -s -X DELETE http://localhost:5000/api/destinations/1

# Health check
curl -s http://localhost:5000/health
```

---

## AWS Deployment

### Prerequisites

- AWS CLI configured (`aws configure`)
- Node.js (for frontend build)

### 1. Networking

```bash
# VPC
VPC_ID=$(aws ec2 create-vpc --cidr-block 10.0.0.0/16 \
  --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=travel-wishlist-vpc}]' \
  --query 'Vpc.VpcId' --output text)

aws ec2 modify-vpc-attribute --vpc-id $VPC_ID --enable-dns-hostnames
aws ec2 modify-vpc-attribute --vpc-id $VPC_ID --enable-dns-support

# Internet Gateway
IGW_ID=$(aws ec2 create-internet-gateway \
  --tag-specifications 'ResourceType=internet-gateway,Tags=[{Key=Name,Value=travel-wishlist-igw}]' \
  --query 'InternetGateway.InternetGatewayId' --output text)
aws ec2 attach-internet-gateway --internet-gateway-id $IGW_ID --vpc-id $VPC_ID

# Subnets
PUBLIC_SUBNET=$(aws ec2 create-subnet --vpc-id $VPC_ID \
  --cidr-block 10.0.1.0/24 --availability-zone us-east-1a \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=travel-wishlist-public}]' \
  --query 'Subnet.SubnetId' --output text)

PRIVATE_SUBNET_1=$(aws ec2 create-subnet --vpc-id $VPC_ID \
  --cidr-block 10.0.2.0/24 --availability-zone us-east-1a \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=travel-wishlist-private-1}]' \
  --query 'Subnet.SubnetId' --output text)

PRIVATE_SUBNET_2=$(aws ec2 create-subnet --vpc-id $VPC_ID \
  --cidr-block 10.0.3.0/24 --availability-zone us-east-1b \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=travel-wishlist-private-2}]' \
  --query 'Subnet.SubnetId' --output text)

# Route table for public subnet
RTB=$(aws ec2 create-route-table --vpc-id $VPC_ID \
  --query 'RouteTable.RouteTableId' --output text)
aws ec2 create-route --route-table-id $RTB \
  --destination-cidr-block 0.0.0.0/0 --gateway-id $IGW_ID
aws ec2 associate-route-table --route-table-id $RTB --subnet-id $PUBLIC_SUBNET
```

### 2. Security Groups

```bash
# EC2 security group
EC2_SG=$(aws ec2 create-security-group \
  --group-name travel-wishlist-ec2-sg \
  --description "EC2 security group" --vpc-id $VPC_ID \
  --query 'GroupId' --output text)
aws ec2 authorize-security-group-ingress --group-id $EC2_SG --protocol tcp --port 22 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id $EC2_SG --protocol tcp --port 5000 --cidr 0.0.0.0/0

# RDS security group (only allows traffic from EC2)
RDS_SG=$(aws ec2 create-security-group \
  --group-name travel-wishlist-rds-sg \
  --description "RDS security group" --vpc-id $VPC_ID \
  --query 'GroupId' --output text)
aws ec2 authorize-security-group-ingress --group-id $RDS_SG \
  --protocol tcp --port 5432 --source-group $EC2_SG
```

### 3. RDS PostgreSQL

```bash
aws rds create-db-subnet-group \
  --db-subnet-group-name travel-wishlist-subnet-group \
  --db-subnet-group-description "Subnet group" \
  --subnet-ids $PRIVATE_SUBNET_1 $PRIVATE_SUBNET_2

aws rds create-db-instance \
  --db-instance-identifier travel-wishlist-db \
  --db-instance-class db.t3.micro \
  --engine postgres --engine-version 15 \
  --master-username postgres \
  --master-user-password <YOUR_PASSWORD> \
  --allocated-storage 20 \
  --db-name traveldb \
  --db-subnet-group-name travel-wishlist-subnet-group \
  --vpc-security-group-ids $RDS_SG \
  --no-publicly-accessible \
  --backup-retention-period 1

# Wait until available
aws rds wait db-instance-available --db-instance-identifier travel-wishlist-db

RDS_ENDPOINT=$(aws rds describe-db-instances \
  --db-instance-identifier travel-wishlist-db \
  --query 'DBInstances[0].Endpoint.Address' --output text)
```

### 4. EC2

```bash
# Key pair
aws ec2 create-key-pair --key-name travel-wishlist-key \
  --query 'KeyMaterial' --output text > ~/.ssh/travel-wishlist-key.pem
chmod 400 ~/.ssh/travel-wishlist-key.pem

# Get latest Amazon Linux 2023 AMI
AMI=$(aws ec2 describe-images --owners amazon \
  --filters "Name=name,Values=al2023-ami-2023*-x86_64" "Name=state,Values=available" \
  --query 'sort_by(Images, &CreationDate)[-1].ImageId' --output text)

aws ec2 modify-subnet-attribute --subnet-id $PUBLIC_SUBNET --map-public-ip-on-launch

INSTANCE_ID=$(aws ec2 run-instances \
  --image-id $AMI --instance-type t3.micro \
  --key-name travel-wishlist-key \
  --subnet-id $PUBLIC_SUBNET \
  --security-group-ids $EC2_SG \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=travel-wishlist-backend}]' \
  --query 'Instances[0].InstanceId' --output text)

aws ec2 wait instance-running --instance-ids $INSTANCE_ID

EC2_IP=$(aws ec2 describe-instances --instance-ids $INSTANCE_ID \
  --query 'Reservations[0].Instances[0].PublicIpAddress' --output text)
EC2_DNS=$(aws ec2 describe-instances --instance-ids $INSTANCE_ID \
  --query 'Reservations[0].Instances[0].PublicDnsName' --output text)
```

### 5. Deploy backend on EC2

```bash
ssh -i ~/.ssh/travel-wishlist-key.pem ec2-user@$EC2_IP

# On the EC2 instance:
sudo dnf install -y python3 python3-pip git
pip3 install flask flask-cors psycopg2-binary python-dotenv requests gunicorn

git clone https://github.com/MateoZouko/travel-wishlist.git
cd travel-wishlist && git checkout develop

# Create environment file
cat > .env << EOF
DB_HOST=<RDS_ENDPOINT>
DB_PORT=5432
DB_NAME=traveldb
DB_USER=postgres
DB_PASSWORD=<YOUR_PASSWORD>
EOF

# Create systemd service
sudo tee /etc/systemd/system/travel-wishlist.service > /dev/null << EOF
[Unit]
Description=Travel Wishlist Flask Backend
After=network.target

[Service]
User=ec2-user
WorkingDirectory=/home/ec2-user/travel-wishlist/backend
EnvironmentFile=/home/ec2-user/travel-wishlist/.env
ExecStart=/home/ec2-user/.local/bin/gunicorn --workers 2 --bind 0.0.0.0:5000 app:app
Restart=always

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable travel-wishlist
sudo systemctl start travel-wishlist
```

### 6. Frontend — S3 + CloudFront

```bash
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
BUCKET="travel-wishlist-frontend-$ACCOUNT_ID"

aws s3api create-bucket --bucket $BUCKET --region us-east-1

# Build React app pointing to CloudFront (set after creating the distribution)
REACT_APP_API_URL=https://<CLOUDFRONT_DOMAIN>/api npm run build --prefix frontend

aws s3 sync frontend/build s3://$BUCKET --delete

# Make bucket publicly readable
aws s3api put-public-access-block --bucket $BUCKET \
  --public-access-block-configuration \
  "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"

aws s3api put-bucket-policy --bucket $BUCKET --policy "{
  \"Version\": \"2012-10-17\",
  \"Statement\": [{
    \"Effect\": \"Allow\",
    \"Principal\": \"*\",
    \"Action\": \"s3:GetObject\",
    \"Resource\": \"arn:aws:s3:::$BUCKET/*\"
  }]
}"

# Create CloudFront distribution
# Add S3 as default origin and EC2 DNS as /api/* origin
# See AWS Console or use aws cloudfront create-distribution
```

---

## Project Structure

```
travel-wishlist/
├── backend/
│   ├── app.py                  # Flask app entry point
│   ├── database.py             # PostgreSQL connection and init_db
│   ├── routes/
│   │   └── destinations.py     # CRUD endpoints + RestCountries integration
│   ├── stored_procedures.sql   # SQL stored procedures
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── DestinationForm.tsx
│       │   └── DestinationList.tsx
│       ├── context/
│       │   └── DestinationContext.tsx  # Global state (Context API)
│       └── types/
│           └── index.ts
├── docker-compose.yml
└── README.md
```
