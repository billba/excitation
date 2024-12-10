import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class Templates {
    @PrimaryGeneratedColumn()
    template_id!: number;

    @Column('template_name')
    template_name!: string;

    @Column('creator')
    creator!: string;

    @CreateDateColumn('created_at')
    created_at!: Date;

    @UpdateDateColumn('modified_at')
    modified_at!: Date;
}
