import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { BusinessExceptions } from '../../common/utils/exception/business.exception';
import {
  CreateMenuDto,
  UpdateMenuDto,
  MenuSortDto,
  CreateButtonPermissionDto,
  UpdateButtonPermissionDto,
} from './dto/permission.dto';

@Injectable()
export class PermissionService {
  constructor(private readonly prisma: PrismaService) {}

  // ========== Menu Methods ==========

  async getMenuTree(status?: number, roleIds?: number[]) {
    // 构建查询条件
    const where: any = {};
    if (status !== undefined) {
      where.status = status;
    }
    // 如果提供了 roleIds，只返回这些角色有权限的菜单
    if (roleIds && roleIds.length > 0) {
      where.roles = {
        some: {
          id: { in: roleIds },
        },
      };
    }

    // 获取菜单
    const menus = await this.prisma.menu.findMany({
      where,
    });

    // 构建树形结构
    const menuMap = new Map();
    const rootMenus: any[] = [];

    // 第一遍：创建所有菜单节点
    menus.forEach((menu) => {
      menuMap.set(menu.id, menu);
    });

    // 第二遍：构建父子关系
    menus.forEach((menu) => {
      const menuNode = menuMap.get(menu.id);
      if (menu.parentId) {
        const parent = menuMap.get(menu.parentId);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(menuNode);
        }
      } else {
        rootMenus.push(menuNode);
      }
    });

    // 按 sort 排序
    const sortMenus = (menus: any[]) => {
      menus.sort((a, b) => a.sort - b.sort);
      menus.forEach((menu) => {
        if (menu.children && menu.children.length > 0) {
          sortMenus(menu.children);
        }
      });
    };

    sortMenus(rootMenus);

    return {
      tree: rootMenus,
    };
  }

  async getMenuDetail(id: number) {
    const menu = await this.prisma.menu.findUnique({
      where: { id },
    });

    if (!menu) {
      throw BusinessExceptions.NO_PERMISSION('菜单不存在');
    }

    return menu;
  }

  async createMenu(createMenuDto: CreateMenuDto) {
    // 如果指定了 parentId，验证父菜单是否存在
    if (createMenuDto.parentId) {
      const parent = await this.prisma.menu.findUnique({
        where: { id: createMenuDto.parentId },
      });

      if (!parent) {
        throw BusinessExceptions.NO_PERMISSION('父菜单不存在');
      }
    }

    const menu = await this.prisma.menu.create({
      data: createMenuDto,
    });

    return menu;
  }

  async updateMenu(id: number, updateMenuDto: UpdateMenuDto) {
    // 检查菜单是否存在
    const existingMenu = await this.prisma.menu.findUnique({
      where: { id },
    });

    if (!existingMenu) {
      throw BusinessExceptions.NO_PERMISSION('菜单不存在');
    }

    if (existingMenu.isSystem) {
      throw BusinessExceptions.OPERATION_FORBIDDEN('系统菜单，无法修改');
    }

    const menu = await this.prisma.menu.update({
      where: { id },
      data: updateMenuDto,
    });

    return menu;
  }

  async deleteMenu(id: number) {
    // 检查菜单是否存在
    const menu = await this.prisma.menu.findUnique({
      where: { id },
      include: {
        children: true,
      },
    });

    if (!menu) {
      throw BusinessExceptions.NO_PERMISSION('菜单不存在');
    }

    if (menu.isSystem) {
      throw BusinessExceptions.OPERATION_FORBIDDEN('系统菜单，无法删除');
    }

    // 如果有子菜单，不能删除
    if (menu.children.length > 0) {
      throw BusinessExceptions.OPERATION_FORBIDDEN('存在子菜单，无法删除');
    }

    await this.prisma.menu.delete({
      where: { id },
    });

    return true;
  }

  async updateMenuSort(sortDto: MenuSortDto) {
    // 从菜单表读取所有系统菜单的ID数组和名称
    const systemMenus = await this.prisma.menu.findMany({
      where: { isSystem: true },
      select: { id: true, name: true },
    });

    // 创建系统菜单名称映射，用于快速判断和错误提示
    const systemMenuNameMap = new Map(
      systemMenus.map((menu) => [menu.id, menu.name]),
    );

    // 过滤掉系统菜单，同时检查是否有菜单被移到系统目录下
    const nonSystemItems: typeof sortDto.items = [];
    const systemParentIds: number[] = [];

    for (const item of sortDto.items) {
      // 跳过系统菜单本身
      if (systemMenuNameMap.has(item.id)) {
        continue;
      }

      // 检查父菜单是否是系统菜单
      if (item.parentId && systemMenuNameMap.has(item.parentId)) {
        systemParentIds.push(item.parentId);
        continue;
      }

      nonSystemItems.push(item);
    }

    // 如果有菜单被移到系统目录下，抛出异常
    if (systemParentIds.length > 0) {
      const systemParentNames = Array.from(
        new Set(systemParentIds.map((id) => systemMenuNameMap.get(id))),
      )
        .filter(Boolean)
        .join('、');
      throw BusinessExceptions.OPERATION_FORBIDDEN(
        `无法将菜单移动到系统目录下：${systemParentNames}`,
      );
    }

    // 如果没有需要更新的菜单，直接返回
    if (nonSystemItems.length === 0) {
      return true;
    }

    // 批量更新菜单排序（只更新非系统菜单）
    const updatePromises = nonSystemItems.map((item) => {
      return this.prisma.menu.update({
        where: { id: item.id },
        data: {
          sort: item.sort,
          parentId: item.parentId,
        },
      });
    });

    await Promise.all(updatePromises);

    return true;
  }

  // ========== API Permission Methods ==========

  async getAllApiPermissions() {
    const permissions = await this.prisma.apiPermission.findMany({
      orderBy: {
        createTime: 'desc',
      },
    });

    return permissions;
  }

  // ========== Button Permission Methods ==========

  async getButtonPermissionsByMenuId(menuId: number) {
    // 验证菜单是否存在
    const menu = await this.prisma.menu.findUnique({
      where: { id: menuId },
    });

    if (!menu) {
      throw BusinessExceptions.NO_PERMISSION('菜单不存在');
    }

    const buttons = await this.prisma.button.findMany({
      where: { menuId },
      orderBy: {
        createTime: 'desc',
      },
    });

    return buttons;
  }

  async createButtonPermission(createDto: CreateButtonPermissionDto) {
    // 验证菜单是否存在
    const menu = await this.prisma.menu.findUnique({
      where: { id: createDto.menuId },
    });

    if (!menu) {
      throw BusinessExceptions.NO_PERMISSION('菜单不存在');
    }

    // 检查同一菜单下是否已有相同 code 的按钮
    const existingButton = await this.prisma.button.findUnique({
      where: {
        menuId_code: {
          menuId: createDto.menuId,
          code: createDto.code,
        },
      },
    });

    if (existingButton) {
      throw BusinessExceptions.EXIST('按钮权限标识码');
    }

    const button = await this.prisma.button.create({
      data: createDto,
    });

    return button;
  }

  async updateButtonPermission(
    id: number,
    updateDto: UpdateButtonPermissionDto,
  ) {
    // 检查按钮权限是否存在
    const existingButton = await this.prisma.button.findUnique({
      where: { id },
    });

    if (!existingButton) {
      throw BusinessExceptions.NO_PERMISSION('按钮权限不存在');
    }

    // 如果更新 code，检查是否冲突
    if (updateDto.code && updateDto.code !== existingButton.code) {
      const conflictButton = await this.prisma.button.findUnique({
        where: {
          menuId_code: {
            menuId: existingButton.menuId,
            code: updateDto.code,
          },
        },
      });

      if (conflictButton) {
        throw BusinessExceptions.EXIST('按钮权限标识码');
      }
    }

    const button = await this.prisma.button.update({
      where: { id },
      data: updateDto,
    });

    return button;
  }

  async deleteButtonPermission(id: number) {
    // 检查按钮权限是否存在
    const button = await this.prisma.button.findUnique({
      where: { id },
    });

    if (!button) {
      throw BusinessExceptions.NO_PERMISSION('按钮权限不存在');
    }

    await this.prisma.button.delete({
      where: { id },
    });

    return true;
  }
}
