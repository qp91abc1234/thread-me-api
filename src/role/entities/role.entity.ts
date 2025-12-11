import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Permission } from '../../permission/entities/permission.entity';
import { User } from 'src/user/entities/user.entity';
import { IsNotEmpty, IsString, Length } from 'class-validator';

@Entity()
export class Role {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    length: 20,
    unique: true,
  })
  @IsNotEmpty({ message: '角色名不能为空' })
  @IsString({ message: '角色名必须是字符串' })
  @Length(2, 20, { message: '角色名长度必须在2-20个字符之间' })
  name: string;

  @Column({
    default: false,
    comment: '是否为系统默认角色，不可删除',
  })
  isSystem: boolean;

  @CreateDateColumn()
  createTime: Date;

  @UpdateDateColumn()
  updateTime: Date;

  @ManyToMany(() => User, (user) => user.roles)
  users: User[];

  @JoinTable()
  @ManyToMany(() => Permission)
  permissions: Permission[];

  constructor(partial?: Partial<Role>) {
    Object.assign(this, partial);
  }
}
