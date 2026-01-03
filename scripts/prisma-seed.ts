/**
 * 路径解析支持（baseUrl 和 paths 配置）
 * @see docs/typescript-path-resolution.md#解决方案
 */
import 'tsconfig-paths/register';

import { PrismaClient } from 'prisma/generated/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import * as bcrypt from 'bcrypt';
import { config } from 'dotenv';
import { env } from 'prisma/config';

// 加载开发环境配置文件
// - 开发环境：.env.development.local 文件存在，会加载其中的环境变量（如 DATABASE_URL）
// - 生产环境：.env.development.local 文件不存在，dotenv 会忽略（不报错），使用容器中已设置的环境变量
config({ path: '.env.development.local' });

/**
 * 菜单配置类型（支持递归的 children）
 */
type MenuConfig = {
  name: string;
  path: string;
  icon: string;
  compPath: string;
  type: number;
  sort: number;
  visible: boolean;
  status: number;
  parentId?: number | null;
  children?: MenuConfig[];
};

type MenuData = Omit<MenuConfig, 'children' | 'parentId'>;

const prisma = new PrismaClient({
  adapter: new PrismaMariaDb(env('DATABASE_URL')),
});

const SEED_CONFIG = {
  ROLES: [
    {
      name: 'admin',
      status: 1, // 状态：0-禁用，1-启用
      isSystem: true,
    },
    {
      name: 'general_user',
      status: 1, // 状态：0-禁用，1-启用
      isSystem: false,
    },
  ],
  USERS: [
    {
      username: 'admin',
      password: 'admin123',
      realName: '管理员',
      email: '',
      phone: '',
      status: 1, // 状态：0-禁用，1-启用
      isSystem: true,
      roles: ['admin'],
    },
  ],
  MENUS: [
    // 权限管理目录
    {
      name: '权限管理',
      path: 'rbac',
      icon: 'Lock',
      compPath: '',
      type: 0, // 目录
      sort: 0,
      visible: true,
      status: 1,
      isSystem: true,
      parentId: null,
      children: [
        {
          name: '用户管理',
          path: 'user',
          icon: '',
          compPath: '/src/views/user/user.vue',
          type: 1, // 菜单项
          sort: 0,
          visible: true,
          status: 1,
          isSystem: true,
        },
        {
          name: '角色管理',
          path: 'role',
          icon: '',
          compPath: '/src/views/role/role.vue',
          type: 1, // 菜单项
          sort: 1,
          visible: true,
          status: 1,
          isSystem: true,
        },
        {
          name: '菜单管理',
          path: 'menu',
          icon: '',
          compPath: '/src/views/menu/menu.vue',
          type: 1, // 菜单项
          sort: 2,
          visible: true,
          status: 1,
          isSystem: true,
        },
      ],
    },
  ],
};

/**
 * 初始化角色
 */
async function seedRoles() {
  for (const r of SEED_CONFIG.ROLES) {
    await prisma.role.upsert({
      where: { name: r.name },
      update: {
        status: r.status,
      },
      create: {
        name: r.name,
        status: r.status,
        isSystem: r.isSystem,
      },
    });
    console.log(`✅ Upserted Role: ${r.name}`);
  }
}

/**
 * 初始化用户
 */
async function seedUsers() {
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
          realName: u.realName,
          email: u.email,
          phone: u.phone,
          status: u.status,
          isSystem: u.isSystem,
          roles: {
            connect: rolesConnect,
          },
        },
      });
      console.log(`✅ Created User: ${u.username} (${u.realName})`);
    } else {
      // 更新用户信息（不重置密码）
      await prisma.user.update({
        where: { username: u.username },
        data: {
          realName: u.realName,
          email: u.email,
          phone: u.phone,
          status: u.status,
          isSystem: u.isSystem,
          roles: {
            set: rolesConnect,
          },
        },
      });
      console.log(`🔄 Updated User: ${u.username} (${u.realName})`);
    }
  }
}

/**
 * 初始化菜单
 * @returns 返回所有创建的菜单ID数组
 */
async function seedMenus(): Promise<number[]> {
  const allMenuIds: number[] = [];

  // 递归处理所有菜单（从根菜单开始）
  for (const menu of SEED_CONFIG.MENUS) {
    await processMenuRecursively(menu, undefined, undefined, allMenuIds);
  }

  return allMenuIds;
}

/**
 * 递归处理菜单及其子菜单
 * @param menuConfig 菜单配置
 * @param parentId 父菜单ID（可选）
 * @param parentPath 父菜单路径（用于日志输出）
 * @param allMenuIds 存储所有菜单ID的数组
 */
async function processMenuRecursively(
  menuConfig: MenuConfig,
  parentId: number | undefined,
  parentPath: string | undefined,
  allMenuIds: number[],
): Promise<void> {
  const { children, ...menuData } = menuConfig;
  const fullPath = parentPath
    ? `${parentPath}/${menuData.path}`
    : menuData.path;

  // 创建或更新当前菜单
  const menuId = await upsertMenu(menuData, parentId, parentPath);
  allMenuIds.push(menuId);

  // 递归处理子菜单
  if (children && children.length > 0) {
    for (const child of children) {
      await processMenuRecursively(child, menuId, fullPath, allMenuIds);
    }
  }
}

/**
 * 创建或更新菜单
 * @param menuData 菜单数据
 * @param parentId 父菜单ID（可选）
 * @param parentPath 父菜单路径（用于日志输出）
 * @returns 返回菜单ID
 */
async function upsertMenu(
  menuData: MenuData,
  parentId?: number,
  parentPath?: string,
): Promise<number> {
  const existingMenu = await prisma.menu.findFirst({
    where: { path: menuData.path, parentId: parentId ?? null },
  });

  const fullPath = parentPath
    ? `${parentPath}/${menuData.path}`
    : menuData.path;

  if (!existingMenu) {
    const createdMenu = await prisma.menu.create({
      data: {
        ...menuData,
        parentId: parentId ?? null,
      },
    });
    console.log(`✅ Created Menu: ${menuData.name} (${fullPath})`);
    return createdMenu.id;
  } else {
    await prisma.menu.update({
      where: { id: existingMenu.id },
      data: menuData,
    });
    console.log(`🔄 Updated Menu: ${menuData.name} (${fullPath})`);
    return existingMenu.id;
  }
}

/**
 * 将所有菜单分配给管理员角色
 */
async function assignMenusToAdmin(menuIds: number[]) {
  if (menuIds.length === 0) {
    console.log('⚠️  No menus to assign');
    return;
  }

  const adminRole = await prisma.role.findUnique({
    where: { name: 'admin' },
  });

  if (!adminRole) {
    console.log('⚠️  Admin role not found, skipping menu assignment');
    return;
  }

  await prisma.role.update({
    where: { id: adminRole.id },
    data: {
      menus: {
        set: menuIds.map((id) => ({ id })),
      },
    },
  });
  console.log(`✅ Assigned ${menuIds.length} menus to admin role`);
}

/**
 * 主函数：执行所有种子数据初始化
 */
async function main() {
  let hasError = false;
  try {
    console.log('🌱 Starting seeding...');

    // 1. 初始化角色
    await seedRoles();

    // 2. 初始化用户
    await seedUsers();

    // 3. 初始化菜单
    const menuIds = await seedMenus();

    // 4. 将所有菜单分配给管理员角色
    await assignMenusToAdmin(menuIds);

    console.log('🎉 Seeding completed successfully!');
  } catch (e) {
    console.error(e);
    hasError = true;
  } finally {
    await prisma.$disconnect();
    process.exit(hasError ? 1 : 0);
  }
}

main();
