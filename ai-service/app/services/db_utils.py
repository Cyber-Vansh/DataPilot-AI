import os
import pandas as pd
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
from urllib.parse import quote_plus
from ..models import DBConnection

def get_engine(db_connection: DBConnection):
    if db_connection.type == 'mysql':
        config = db_connection.config
        host = config.get('host', 'localhost')
        port = int(config.get('port', 3306))
        user = config.get('user', '')
        password = config.get('password', '')
        database = config.get('database', '')
        
        if ':' in host:
            host = host.split(':')[0]
        
        if host in ['localhost', '127.0.0.1']:
             host = 'host.docker.internal'

        encoded_password = quote_plus(password)
        
        db_uri = f"mysql+pymysql://{user}:{encoded_password}@{host}:{port}/{database}"
        
        return create_engine(db_uri)
    
    elif db_connection.type == 'csv':
        import io
        
        engine = create_engine(
            "sqlite://", 
            poolclass=StaticPool,
            connect_args={"check_same_thread": False}
        )

        if 'csvContent' in db_connection.config:
            csv_content = db_connection.config['csvContent']
            df = pd.read_csv(io.StringIO(csv_content))
        else:
            csv_path = db_connection.config.get('csvPath')
            if not csv_path:
                 raise ValueError("CSV path or content required")
            filename = os.path.basename(csv_path)
            full_path = f"/app/uploads/{filename}"
            if not os.path.exists(full_path):
                 if os.path.exists(csv_path):
                     full_path = csv_path
                 else:
                     raise ValueError(f"CSV file not found at {full_path}")
            
            df = pd.read_csv(full_path)
        
        df.to_sql("data", engine, index=False, if_exists='replace')
        
        return engine

    else:
        raise ValueError("Invalid database type")
