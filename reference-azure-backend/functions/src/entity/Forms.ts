import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Templates } from "./Templates";

@Entity()
export class Forms {
    @PrimaryGeneratedColumn()
    form_id!: number;

    @ManyToOne(() => Templates)
    @Column('int')
    template_id: number;

    @Column('text')
    form_name!: string;

    @CreateDateColumn('datetime')
    created_at!: Date;

    @UpdateDateColumn('datetime')
    modified_at!: Date;
}