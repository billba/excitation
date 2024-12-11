import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Templates } from "./Templates";

@Entity({
    name: 'forms',
    schema: 'dbo'
})
export class Forms {
    @PrimaryGeneratedColumn()
    form_id!: number;

    @ManyToOne(() => Templates)
    @Column('int')
    template_id: number;

    @Column('text')
    form_name!: string;

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    modified_at!: Date;
}