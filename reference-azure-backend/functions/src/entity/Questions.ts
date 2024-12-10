import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Templates } from "./Templates";

@Entity()
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

    @CreateDateColumn('datetime')
    created_at!: Date;

    @UpdateDateColumn('datetime')
    modified_at!: Date;
}