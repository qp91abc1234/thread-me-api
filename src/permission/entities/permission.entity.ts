import { Role } from 'src/role/entities/role.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { IsNotEmpty, IsString, Length } from 'class-validator';

@Entity()
export class Permission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    length: 50,
    unique: true,
  })
  @IsNotEmpty({ message: '权限名不能为空' })
  @IsString({ message: '权限名必须是字符串' })
  @Length(2, 50, { message: '权限名长度必须在2-50个字符之间' })
  name: string;

  @Column({
    default: false,
    comment: '是否为系统默认权限，不可删除',
  })
  isSystem: boolean;

  @CreateDateColumn()
  createTime: Date;

  @UpdateDateColumn()
  updateTime: Date;

  @ManyToMany(() => Role, (role) => role.permissions)
  roles: Role[];

  constructor(partial?: Partial<Permission>) {
    Object.assign(this, partial);
  }
}
