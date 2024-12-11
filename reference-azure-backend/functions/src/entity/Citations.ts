import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Forms } from "./Forms";
import { Questions } from "./Questions";
import { Documents } from "./Documents";

@Entity({
    name: 'citations',
    schema: 'dbo'
})
export class Citations {
    @PrimaryGeneratedColumn()
    citation_id!: string;

    @ManyToOne(() => Forms)
    @Column('int')
    form_id: number;

    @ManyToOne(() => Questions)
    @Column('int')
    question_id: number;

    @ManyToOne(() => Documents)
    @Column('int')
    document_id: number;

    @Column('text')
    excerpt!: string;

    @Column('simple-json')
    bounds: JSON;

    @Column('int', {default: 0})
    review: number = 0;

    @Column('text')
    creator!: string;

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    modified_at!: Date;
}