import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Templates } from "./Templates";

@Entity({
    name: 'questions',
    schema: 'dbo'
})
export class Questions {
    @PrimaryGeneratedColumn()
    question_id!: number;

    @ManyToOne(() => Templates)
    @Column('int')
    template_id: number;

    @Column('text')
    prefix: string;

    @Column('text')
    text!: string;

    @Column('text')
    creator: string;

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    modified_at!: Date;
}