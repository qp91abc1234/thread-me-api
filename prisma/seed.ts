import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import * as bcrypt from 'bcrypt';
import { config } from 'dotenv';
import { env } from 'prisma/config';

// 加载开发环境配置文件
// - 开发环境：.env.development.local 文件存在，会加载其中的环境变量（如 DATABASE_URL）
// - 生产环境：.env.development.local 文件不存在，dotenv 会忽略（不报错），使用容器中已设置的环境变量
config({ path: '.env.development.local' });

const prisma = new PrismaClient({
  adapter: new PrismaMariaDb(env('DATABASE_URL')),
});

const SEED_CONFIG = {
  ROLES: [
    {
      name: 'admin',
      isSystem: true,
    },
    {
      name: 'general_user',
      isSystem: true,
    },
  ],
  USERS: [
    {
      username: 'admin',
      password: 'admin123',
      isSystem: true,
      roles: ['admin'],
    },
    {
      username: 'user',
      password: '123456',
      isSystem: true,
      roles: ['general_user'],
    },
  ],
};

async function main() {
  console.log('🌱 Starting seeding...');

  // 1. 初始化角色 (Roles)
  for (const r of SEED_CONFIG.ROLES) {
    await prisma.role.upsert({
      where: { name: r.name },
      update: {},
      create: {
        name: r.name,
        isSystem: r.isSystem,
      },
    });
    console.log(`✅ Upserted Role: ${r.name}`);
  }

  // 2. 初始化用户 (Users)
  for (const u of SEED_CONFIG.USERS) {
    const rolesConnect = u.roles.map((rName) => ({ name: rName }));

    const existingUser = await prisma.user.findUnique({
      where: { username: u.username },
    });

    if (!existingUser) {
      const hashedPassword = await bcrypt.hash(u.password, 10);
      await prisma.user.create({
        data: {
          username: u.username,
          password: hashedPassword,
          isSystem: u.isSystem,
          roles: {
            connect: rolesConnect,
          },
        },
      });
      console.log(`✅ Created User: ${u.username}`);
    } else {
      // 仅更新角色，不重置密码
      await prisma.user.update({
        where: { username: u.username },
        data: {
          roles: {
            set: rolesConnect,
          },
        },
      });
      console.log(`🔄 Updated User roles: ${u.username}`);
    }
  }

  console.log('🎉 Seeding completed successfully!');
}

let hasError = false;
main()
  .catch((e) => {
    console.error(e);
    hasError = true;
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(hasError ? 1 : 0);
  });
