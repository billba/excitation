import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity({
    name: 'templates',
    schema: 'dbo'
})
export class Templates {
    @PrimaryGeneratedColumn()
    template_id!: number;

    @Column('text')
    template_name!: string;

    @Column('text')
    creator!: string;

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    modified_at!: Date;
}
