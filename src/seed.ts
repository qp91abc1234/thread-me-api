import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Permission } from './permission/entities/permission.entity';
import { Role } from './role/entities/role.entity';
import { User } from './user/entities/user.entity';
import { Repository } from 'typeorm';

// --- Seed 配置常量 ---
const SYS_MANAGE_PERM = 'sys:manage'; // 系统管理权限名常量

const SEED_CONFIG = {
  PERMISSIONS: [
    { name: SYS_MANAGE_PERM, isSystem: true }, // 系统管理超权
    { name: 'user:create', isSystem: false },
    { name: 'user:update', isSystem: false },
    { name: 'user:delete', isSystem: false },
    { name: 'user:query', isSystem: false },
  ],
  ROLES: {
    ADMIN: { name: 'admin', isSystem: true },
    GENERAL: { name: 'general_user', isSystem: true },
  },
  USERS: {
    ADMIN: { username: 'admin', password: 'admin123', isSystem: true },
  },
};

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  // 直接获取 Repository 以绕过 Service/DTO 限制，方便设置 isSystem
  const permRepo: Repository<Permission> = app.get(
    getRepositoryToken(Permission),
  );
  const roleRepo: Repository<Role> = app.get(getRepositoryToken(Role));
  const userRepo: Repository<User> = app.get(getRepositoryToken(User));

  console.log('🌱 Starting seeding...');

  try {
    // -------------------------------------------
    // 1. 初始化权限 (Permissions)
    // -------------------------------------------
    const savedPerms: Permission[] = [];
    for (const p of SEED_CONFIG.PERMISSIONS) {
      let perm = await permRepo.findOne({ where: { name: p.name } });
      if (!perm) {
        perm = permRepo.create(p);
        await permRepo.save(perm);
        console.log(`✅ Created Permission: ${p.name}`);
      }
      savedPerms.push(perm);
    }

    // -------------------------------------------
    // 2. 初始化角色 (Roles)
    // -------------------------------------------

    // 2.1 Admin 角色 (只给 sys:manage 权限)
    let adminRole = await roleRepo.findOne({
      where: { name: SEED_CONFIG.ROLES.ADMIN.name },
    });
    // 查找 sys:manage 权限对象
    const sysManagePerm = savedPerms.find((p) => p.name === SYS_MANAGE_PERM);

    if (!adminRole) {
      adminRole = roleRepo.create({
        ...SEED_CONFIG.ROLES.ADMIN,
        permissions: sysManagePerm ? [sysManagePerm] : [], // 只给超权
      });
      await roleRepo.save(adminRole);
      console.log(`✅ Created Role: ${SEED_CONFIG.ROLES.ADMIN.name}`);
    } else {
      // 更新 admin 权限，确保只有 sys:manage
      adminRole.permissions = sysManagePerm ? [sysManagePerm] : [];
      await roleRepo.save(adminRole);
      console.log(
        `🔄 Updated Role: ${SEED_CONFIG.ROLES.ADMIN.name} permissions (reset to sys:manage)`,
      );
    }

    // 2.2 General User 角色 (GitHub 默认角色)
    let generalRole = await roleRepo.findOne({
      where: { name: SEED_CONFIG.ROLES.GENERAL.name },
    });
    if (!generalRole) {
      generalRole = roleRepo.create({
        ...SEED_CONFIG.ROLES.GENERAL,
        permissions: [], // 暂无权限
      });
      await roleRepo.save(generalRole);
      console.log(`✅ Created Role: ${SEED_CONFIG.ROLES.GENERAL.name}`);
    }

    // -------------------------------------------
    // 3. 初始化用户 (Users)
    // -------------------------------------------
    const adminConfig = SEED_CONFIG.USERS.ADMIN;
    let adminUser = await userRepo.findOne({
      where: { username: adminConfig.username },
    });
    if (!adminUser) {
      adminUser = userRepo.create({
        ...adminConfig,
        roles: [adminRole],
      });
      await userRepo.save(adminUser);
      console.log(
        `✅ Created User: ${adminConfig.username} (Password: ${adminConfig.password})`,
      );
    }

    console.log('🎉 Seeding completed successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await app.close();
  }
}

bootstrap();
