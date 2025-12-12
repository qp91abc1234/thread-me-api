import { register } from 'tsconfig-paths';

register({
  baseUrl: './',
  paths: {},
});

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Permission } from '../src/permission/entities/permission.entity';
import { Role } from '../src/role/entities/role.entity';
import { User } from '../src/user/entities/user.entity';
import { Repository } from 'typeorm';

const SYS_MANAGE_PERM = 'sys:manage';

const SEED_CONFIG = {
  PERMISSIONS: [
    { name: SYS_MANAGE_PERM, isSystem: true }, // 系统管理超权
    { name: 'user:create', isSystem: false },
    { name: 'user:update', isSystem: false },
    { name: 'user:delete', isSystem: false },
    { name: 'user:query', isSystem: false },
  ],
  ROLES: [
    {
      name: 'admin',
      isSystem: true,
      permissions: [SYS_MANAGE_PERM],
    },
    {
      name: 'general_user',
      isSystem: true,
      permissions: [],
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
      password: 'user123',
      isSystem: false,
      roles: ['general_user'],
    },
  ],
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
    const savedPerms: Record<string, Permission> = {}; // Map name -> Entity
    for (const p of SEED_CONFIG.PERMISSIONS) {
      let perm = await permRepo.findOne({ where: { name: p.name } });
      if (!perm) {
        perm = permRepo.create(p);
        await permRepo.save(perm);
        console.log(`✅ Created Permission: ${p.name}`);
      }
      savedPerms[p.name] = perm;
    }

    // -------------------------------------------
    // 2. 初始化角色 (Roles)
    // -------------------------------------------
    const savedRoles: Record<string, Role> = {}; // Map name -> Entity
    for (const r of SEED_CONFIG.ROLES) {
      let role = await roleRepo.findOne({ where: { name: r.name } });

      // 查找该角色配置的权限实体
      const rolePerms = (r.permissions || [])
        .map((pName) => savedPerms[pName])
        .filter(Boolean);

      if (!role) {
        role = roleRepo.create({
          name: r.name,
          isSystem: r.isSystem,
          permissions: rolePerms,
        });
        await roleRepo.save(role);
        console.log(`✅ Created Role: ${r.name}`);
      } else {
        // 更新角色权限
        role.permissions = rolePerms;
        await roleRepo.save(role);
        console.log(`🔄 Updated Role: ${r.name} permissions`);
      }
      savedRoles[r.name] = role;
    }

    // -------------------------------------------
    // 3. 初始化用户 (Users)
    // -------------------------------------------
    for (const u of SEED_CONFIG.USERS) {
      let user = await userRepo.findOne({ where: { username: u.username } });

      // 查找该用户配置的角色实体
      const userRoles = (u.roles || [])
        .map((rName) => savedRoles[rName])
        .filter(Boolean);

      if (!user) {
        user = userRepo.create({
          username: u.username,
          password: u.password,
          isSystem: u.isSystem,
          roles: userRoles,
        });
        await userRepo.save(user);
        console.log(`✅ Created User: ${u.username}`);
      } else {
        // 更新用户角色
        user.roles = userRoles;
        await userRepo.save(user);
        console.log(`🔄 Updated User: ${u.username} roles`);
      }
    }

    console.log('🎉 Seeding completed successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await app.close();
  }
}

bootstrap();
