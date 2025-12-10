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

@Entity()
export class Role {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    length: 20,
  })
  name: string;

  @CreateDateColumn()
  createTime: Date;

  @UpdateDateColumn()
  updateTime: Date;

  @ManyToMany(() => User, (user) => user.roles)
  users: User[];

  @JoinTable()
  @ManyToMany(() => Permission)
  permissions: Permission[];

  constructor(partial: Partial<Role>) {
    Object.assign(this, partial);
  }
}
