let renderPlugIn = (function() {
    //为后端优化，避免对数据库操作过多
    let buffer = {};
    let parent_hasChild = {};
    let id_li = {};
    //为数据库优化，防止id增长太快
    let temp_id = -1;
    let free_ids = [];
    let $root;

    /*
     * Tag 根据层数排序方法
     */
    function order_by_layer(a, b) {
        if (a.layer < b.layer) return -1;
        if (a.layer > b.layer) return 1;
        return 0;
    }


    //寻找父节点
    function findParent(tag, new_created){
        if (tag.layer === 1){
            return $root;
        }

        let $parent_li = id_li[tag.parent_id];
        //返回ul
        return $parent_li.children(".nested");
    }

    //Tag 改名点击事件
    let changeName = function (event) {
        event.stopPropagation();

        let $content = ($(this).parent().prev('span'));
        let $save = $("<i class = \"fas fa-check\"/>");
        let $cancel = $("<i class = \"fas fa-times\"/>");
        $save.css({"margin-left":"10px"});
        $cancel.css({"margin-left":"10px"});

        let $input = $("<input size = \"15\">", {
                val: $content.text(),
                type: "text"
            }
        );
        $input.css({
            "line-height": "0.8em"
        });


        let original = $(this).replaceWith($save);
        $cancel.insertAfter($save);


        //替换
        $save.click(function (event_) {
            event_.stopPropagation();
            let newSpan = $("<span><i class=\"ic-w mx-1\"></i>" + $input.val() + "</span>");

            $save.replaceWith(original);
            $input.replaceWith(newSpan);
            //储存变动
            let toSaveData = {
                id : event.data.tag_id,
                field: 'tag_text',
                new_value : $input.val()
            };
            console.log($input.val());

            if (! buffer.hasOwnProperty(['Update'])){
                buffer['Update'] = [];
            }
            buffer['Update'].push(toSaveData);

            //$content = newSpan;
            original.click({tag_id:event.data.tag_id}, changeName);
            $cancel.css("display","none");
        });

        $content.replaceWith($input);
        $input.select();

        //取消
        $cancel.click(function(event_){
            event_.stopPropagation();
            $save.replaceWith(original);
            original.click({tag_id:event.data.tag_id}, changeName);
            $(this).css("display","none");
            $input.replaceWith($content);
        });

    };

     //Tag 增加事件
    let addTag = function (event){
        event.stopPropagation();
        let word = prompt("新标签名称","");
        if (word){
            let nextId;
            if (free_ids.length === 0){
                nextId= temp_id + 1;
            }
            else{
                nextId = free_ids.pop();
            }

            let new_tag = {
                id:nextId,
                parent_id: event.data.tag.id,
                tag_text : word,
                layer: event.data.tag.layer+1,
                deleted: false
            };

            //If we are adding back a tag we just deleted?
            let found = false;
            if (buffer.hasOwnProperty('Delete')) {
                //Check if we are deleting the new tag we just added
                buffer['Delete'].forEach(function (newTag, index, array) {
                    if (newTag.id === event.data.tag.id) {
                        found = true;
                        array.splice(index, 1);
                        console.log("We found you Added a tag you just Deleted");
                        return found;
                    }
                });
            }
            if (!found) {
                if (!buffer.hasOwnProperty(['Create'])) {
                    buffer['Create'] = [];
                }
                buffer['Create'].push(new_tag);
            }


            let $curLi = $(this).closest("li");
            let $parentUl = $(this).closest("ul");
            let parent = findParent(new_tag, true);

            //让叶变成父元素
            if (!$curLi.children("ul").length && ! event.data.newRoot){
                console.log("Change leaf to parent");
                $curLi.remove();

                let $li = $(" <li class=\"treeview-animated-items\">");
                let $a = $("<a class=\"closed\"> </a>");
                let $i = $("<i class=\"fas fa-angle-right\"></i>");
                let $span = $("<span><i class=\"ic-w mx-1\"></i>" + event.data.tag.tag_text + "</span>");
                //添加子元素容器
                let $ul = $("<ul class=\"nested\"></ul>");
                $a.append($i);
                $a.append($span);
                addOtherIcons($a, event.data.tag);
                $li.attr("id",event.data.tag.id);
                $li.append($a);
                $li.append($ul);
                $parentUl.append($li);
                parent = $ul;
                //id_li[tag.id] = $li;
            }
            appendToParent(parent, new_tag);
        }
        temp_id+=1;
    };

    //Tag 删除事件
    let removeTag = function (event) {
        event.stopPropagation();
        let result = confirm("确认删除？");
        if (result){
            let toSaveData = {
                id:event.data.tag.id
            };

            let found = false;
            //Check if we are deleting the new tag we just added
            if (buffer.hasOwnProperty('Create')) {
                buffer['Create'].forEach(function (newTag, index, array) {
                    if (newTag.id === event.data.tag.id) {
                        found = true;
                        array.splice(index, 1);
                        console.log("We found you deleted a tag you just added");
                        free_ids.push(newTag.id);
                        return found;
                    }
                });
            }
            //If we are deleting an existing tag
            if (!found) {
                if (!buffer.hasOwnProperty(['Delete'])) {
                    buffer['Delete'] = [];
                }
                buffer['Delete'].push(toSaveData);
                free_ids.push(toSaveData.id);
            }
            $(this).parent().parent().css('display','none');
        }
    };

    //添加增减改功能
    function addOtherIcons(wrapper,tag){
        let $out = $("<span></span>");
        $out.css({
            "float":"right"
        });
        //修改
        let $edit = $("<i class = \"far fa-edit\" />");
        $edit.click({tag_id : tag.id}, changeName);
        $edit.css({"margin-left":"10px"});
        $out.append($edit);

        //增加
        let $add = $("<i class = \"fa fa-plus\"/>");
        $add.click({tag:tag}, addTag);
        $add.css({"margin-left":"10px"});
        $out.append($add);

        //删除
        let $delete = $("<i class = \"fa fa-minus\"/>");
        $delete.click({tag:tag}, removeTag);
        $delete.css({"margin-left":"10px"});
        $out.append($delete);

        wrapper.append($out);
    }

    //创建tag元素并添加到父节点中
    function appendToParent(parent, tag){
        let $li;
        //如果为父元素
        if(parent_hasChild[tag.id]){
            $li = $(" <li class=\"treeview-animated-items\">");
            let $a = $("<a class=\"closed\"> </a>");
            let $i = $("<i class=\"fas fa-angle-right\"></i>");
            let $span = $("<span><i class=\"ic-w mx-1\"></i>" + tag.tag_text + "</span>");
            //添加子元素容器
            let $ul = $("<ul class=\"nested\"></ul>");
            $a.append($i);
            $a.append($span);
            addOtherIcons($a, tag);

            $li.append($a);
            $li.append($ul);
            //let out = addOtherIcons($a, tag);
            //out.insertAfter($a);
        }
        //如果为叶元素
        else{
            $li = $("<li></li>");
            let $div = $("<div class=\"treeview-animated-element\"><i class=\"ic-w mr-1\"></i> <span>" + tag.tag_text +"</span></div>");
            $li.append($div);
            addOtherIcons($div,tag);
        }
        $li.attr("id",tag.id);
        id_li[tag.id] = $li;
        parent.append($li);
    }


    //数据库操作
    function fetchAllTags(){
        return new Promise((resolve,reject)=>{
            $.ajax({
                url: 'allTags/',
                type: 'get',
                success: function (data) {
                    let tags = data['tags'];
                    console.log(tags);
                    resolve(tags);
                },
                error:(err)=>{
                    reject(err);
                }
            });
        });
    }
    function upDateAllTags(){
        return new Promise((resolve, reject) =>{
            $.ajax({
                url: 'updateTags/',
                type :'POST',
                data: JSON.stringify(buffer),
                success:function(data){
                    resolve(data);
                },
                error:err=>{
                    reject(err);
                }
            })
        })
    }

    //进入方法
    $(function () {
        fetchAllTags().then(tags => {

            $root = $("<ul class=\"treeview-animated-list mb-3\"></ul>");

            //预处理数据，判断是否有子节点
            tags.sort(order_by_layer);
            tags.forEach(function(tag){
                if (!tag.deleted) {
                    //记录每个节点是否为叶节点
                    if (!parent_hasChild.hasOwnProperty(tag.id)) {
                        parent_hasChild[tag.id] = false;
                    }
                    parent_hasChild[tag.parent_id] = true;

                    //记录当前id最大值，并创建tag对应元素
                    temp_id = tag.id > temp_id ? tag.id : temp_id;
                }
            });

            let parent;
            //创建dom树
            tags.forEach(function(tag){
                //If we are adding the first layer
                if (tag.layer === 1){
                    console.log("adding root: ", tag);
                    parent = $root;
                }
                else{
                    parent = findParent(tag, false);
                }
                appendToParent(parent, tag);
            });


            $("#addRoot").click({tag:{ id: -1, layer: 0}, newRoot:true}, addTag);
            $("#complete").click(function() {
                upDateAllTags().then(data => {
                    upDateAllTags().then(data => {
                        console.log("Number of Rows Affected: " + data.rowsAffected);
                    })
                });
            });

            $(".treeview-animated").append($root);
            $('.treeview-animated').mdbTreeview();
        });
    });
})();

