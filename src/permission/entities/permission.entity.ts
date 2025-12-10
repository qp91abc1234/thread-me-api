import { Role } from 'src/role/entities/role.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Permission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    length: 50,
  })
  name: string;

  @CreateDateColumn()
  createTime: Date;

  @UpdateDateColumn()
  updateTime: Date;

  @ManyToMany(() => Role, (role) => role.permissions)
  roles: Role[];

  constructor(partial: Partial<Permission>) {
    Object.assign(this, partial);
  }
}
