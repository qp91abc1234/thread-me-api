import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { register } from 'tsconfig-paths';

// 加载环境变量
config({ path: '.env.development.local' });

// 注册路径映射，解决绝对路径引用问题
register({
  baseUrl: './',
  paths: {},
});

export default new DataSource({
  type: 'mysql',
  host: process.env.DB_MYSQL_HOST,
  port: Number(process.env.DB_MYSQL_PORT),
  username: process.env.DB_MYSQL_USERNAME,
  password: process.env.DB_MYSQL_PASSWORD,
  database: process.env.DB_MYSQL_DATABASE,
  entities: ['src/**/*.entity{.ts,.js}'],
  migrations: ['src/migrations/*{.ts,.js}'],
  synchronize: false,
});
